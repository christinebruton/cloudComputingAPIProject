const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');
const u = require('./utilities.js')
const datastore = ds.datastore;
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa')
const DOMAIN = 'dev-uixvnmr3.us.auth0.com';



const LAB = "Lab";


router.use(bodyParser.json());



//---------------------------


//
// check user JWT
//

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${DOMAIN}/.well-known/jwks.json`
    }),
  
    // Validate the audience and the issuer.
    issuer: `https://${DOMAIN}/`,
    algorithms: ['RS256']
  });


//
// Create a lab
// requires token
//

router.post('/', u.goi, checkJwt, function(req, res){
    var content_type = req.headers['content-type']
    res.set("Content-Type", "application/json")


//determines if string length is too long, length is number, containment level is 
//one of 4 types
if (!u.l_SF_t_v(req)){
      res.status(400).send(u.msg_400());
}

 //checks that containment level is one allowed by api spec
 else if (!u.c_level_valid(req)){
  res.status(400).send(u.msg_400());
}
 //determines if number and type of parameters are correct
 else if (u.l_p_ok(req) == false){
  console.log ("wrong params");
  res.status(400).send(u.msg_400());
}else{
  u.u_name(req).then(bool => {
    if (bool == false){
        res.status(403).send(u.msg_403()); 
    }else if(bool == true) {
      u.pl(req.body.name, req.body.containment_level, req.body.square_footage, req.user.sub)  
   
        .then( key=>
           //send formatted json back with 200 message
             res.status(201).send(u.ret_l(key, req))).catch((error) => {
              console.error("POST/ ERR: " + error);
            });
    }else {
        //server error
        res.status(500).send(u.msg_500()); 
    }    
});    
}
});

//
// If the supplied JWT is valid, return 200 status code and all labs whose owner matches the "sub" property in the supplied JWT
// If no JWT is provided or an invalid JWT is provided, return empty brackets
//

router.get('/', checkJwt, function(req, res){
  
  // get owner's labs
  console.log ("In GET/labs")
  const labs = u.gls(req, req.user.sub) 
 // const labs = u.gls(req.user.sub)
.then( (labs) => {
      res.status(200).json(labs);
  });
});



//
// delete lab
//

router.delete('/:lab_id', checkJwt, function(req, res, err){
  console.log("In DELETE /labs/:lab_id "+req.params.lab_id )
  const key = datastore.key([LAB, parseInt(req.params.lab_id,10)]);


  u.check(key).then((lab)=>{
    console.log('In router.delete  ' + JSON.stringify(lab[0].owner) + "user id " +req.user.sub );  
   
    if (lab ===null || typeof lab === 'undefined'){
      res.status(403).send(u.msg_403());
      console.log ("it's null");
    }else  if (lab[0].owner != req.user.sub)  {
      res.status(403).send(u.msg_403());
    }else {
      u.delete_l(key).then(res.status(204).end())
    }
  //error thrown from check
  }).catch((err)=>{
    console.log('In router.delete  caught ' + err); 
    res.status(403).send(u.msg_403());
}); 
 
});



  /* ------------- End Controller Functions ------------- */

module.exports = router;