const express = require('express');
const app = express();
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
      u.pl(req.body.name, req.body.containment_level, req.body.square_footage, req.user.sub, req.user)  
   
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
// PUT: Update relationship
//
 router.put('/:lab_id/agents/:agent_id', function(req, res){
   console.log ("IN PUT relationship")

//   const lab_key = datastore.key([LAB, parseInt(req.params.lab_id,10)]);
//   console.log ("lab_key "+ JSON.stringify(lab_key))
//   var valid_input = true; 
//   switch (u.comp_k(req.body)){
//     case 1:
//       console.log("PUT comp_k returns: case 1");
//         valid_input = false;
//         break;
//     case 2:
//       console.log("PUT comp_k returns: case 2");
//         valid_input =false;
//         break;
//     case 3:
//       console.log("PUT comp_k returns: case 3");
//         valid_input=true;
//         break;
//     default:
//       console.log("PUT comp_k returns: default");
//         valid_input=true;
//   }
//   if (valid_input == false)
//   {
//       console.log("PUT:Valid_input == false")
//       res.status(400).send(u.msg_400());
//   }else if (valid_input == true){
//     console.log("PUT: Valid_input == true")
//     console.log("PUT: res "+ res+ " req.params.lab_id " + req.params.lab_id + " req.body.name " + req.body.name+ " req.body.containment_level "+ req.body.containment_level+ " req.body.square_footage " + req.body.square_footage+" req.body.lab"+ JSON.stringify(req.body.agent))
//    u.put_l(res, req.params.lab_id, req.body.name, req.body.containment_level, req.body.square_footage, req.body.lab) 
//    .then(
//     datastore.get(lab_key,(err, lab)=>{ 
//         if (!err){
//         console.log ("Object.keys "+ Object.keys(lab))
//         console.log (lab['name'])
//         queryData = {
//                         id: lab_key.id,
//                         name: lab.name,
//                         containment_level: lab.containment_level,
//                         square_footage: lab.square_footage,
//                         agent: agent.agent,
//                         owner:lab.owner,
//                         self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + lab_key.id 
//                     };
//                     console.log("lab.name "+ lab['name'])
//                     //res.status(303)
//                     res.status(200).json(queryData);
//         }
//           else if (err){
//         console.log ("PUT: There was an error in dayast")
//         res.status(502).send(u.msg_502())
//         } 
//     })
// )


//   }


 });

//
// PUT: Update lab
//
router.put('/:lab_id', checkJwt, function(req, res){
  console.log ("IN PUT")

  const lab_key = datastore.key([LAB, parseInt(req.params.lab_id,10)]);
  console.log ("lab_key "+ JSON.stringify(lab_key))
  var valid_input = true; 
  switch (u.comp_k(req.body)){
    case 1:
      console.log("PUT comp_k returns: case 1");
        valid_input = false;
        break;
    case 2:
      console.log("PUT comp_k returns: case 2");
        valid_input =false;
        break;
    case 3:
      console.log("PUT comp_k returns: case 3");
        valid_input=true;
        break;
    default:
      console.log("PUT comp_k returns: default");
        valid_input=true;
  }
  if (valid_input == false)
  {
      console.log("PUT:Valid_input == false")
      res.status(400).send(u.msg_400());
  }else if (valid_input == true){
    console.log("PUT: Valid_input == true lab "+ JSON.stringify(req.body))
    console.log("PUT: res "+ res+ " req.params.lab_id " + req.params.lab_id + " req.body.name " + req.body.name+ " req.body.containment_level "+ req.body.containment_level+ " req.body.square_footage " + req.body.square_footage+" req.body.lab"+ JSON.stringify(req.body.lab))
   u.put_l(res, req.params.lab_id, req.body.name, req.body.containment_level, req.body.square_footage, req.user.sub, req.body.agent) 
   .then(
    datastore.get(lab_key,(err, lab)=>{ 
        if (!err){
        console.log ("Object.keys "+ Object.keys(lab))
        console.log ("LAB agent "+ JSON.stringify(lab.agent))
        console.log (lab['name'])
        queryData = {
                        id: lab_key.id,
                        name: lab.name,
                        containment_level: lab.containment_level,
                        square_footage: lab.square_footage,
                        agent: lab.agent,
                        owner:lab.owner,
                        self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + lab_key.id 
                    };
                    console.log("lab.name "+ lab['name'])
                    //res.status(303)
                    res.status(200).json(queryData);
        }
          else if (err){
          console.log ("PUT: There was an error in dayast")
          res.status(502).send(u.msg_502())
          } 
      })
)


}


});


//
// PATCH: Update lab
//
router.patch('/:lab_id', checkJwt, function(req, res){
  console.log ("IN PATCH")
  const lab_key = datastore.key([LAB, parseInt(req.params.lab_id,10)]);
  
   //u.count_k (req.body);
   var valid_input; 
       switch (u.count_k(req.body)){
        case 1:
            valid_input = false;
            break;
        case 2:
            valid_input =false;
            break;
        case 3:
            valid_input=true;
            break;
        default:
            valid_input=true;
       } if (valid_input == false){
           res.status(400).send(u.msg_400());
       }else if (valid_input == true){
           //the request is valid, update parameters
           u.which_k(req).then(
               datastore.get(lab_key,(err, lab)=>{
                   if (!err){
                    queryData = {
                      id: lab_key.id,
                      name: lab.name,
                      containment_level: lab.containment_level,
                      square_footage: lab.square_footage,
                      agent: lab.agent,
                      owner:lab.owner,
                      self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + lab_key.id 
                  };
                       console.log("lab.name "+ lab.name)
                       res.status(200).json(queryData);
                   }
               //console.log(JSON.stringify(ret_boat))
               else if (err){
                console.log ("PUT: There was an error in datastore")
                res.status(502).send(u.msg_502())
               } 
           })
           )
       }
   });

     
         


//
// If the supplied JWT is valid, return 200 status code and all labs whose owner matches the "sub" property in the supplied JWT
// If no JWT is provided or an invalid JWT is provided, return empty brackets
//

router.get('/', checkJwt, function(req, res){
  const accepts = req.accepts(['application/json']);
  console.log ("accepts is "+ accepts)
  if (!accepts){
      console.log("GET: request is not of acceptable type")
      res.status (406).send(u.msg_406())
  }else {

  // get owner's labs
  console.log ("In GET/labs")
  const labs = u.gls(req, req.user.sub) 
 // const labs = u.gls(req.user.sub)
.then( (labs) => {
      res.status(200).json(labs);
  });
}
});


//
//get lab by ID
//
router.get('/:lab_id', checkJwt, function(req, res, next){
   console.log ("in get/lab id " + req.params.lab_id)
   const lab_key = datastore.key([LAB, parseInt(req.params.lab_id,10)]);
   console.log ("in get: lab id key " + JSON.stringify(lab_key));
  
   u.check(lab_key).then( lab =>{
    console.log(u.oc(lab, req.user.sub)),
     console.log("get/:lab_id. JWT id " + req.user.sub + " lab owner from db "+ lab[0].owner)
     console.log("in get: returned lab " + JSON.stringify(lab) ),
     res.status(200).json(u.pass_l(lab, req));
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
      res.status(401).send(u.msg_401());
    }else {
      u.delete_l(key).then(res.status(204).end())
    }
  //error thrown from check
  }).catch((err)=>{
    console.log('In router.delete  caught ' + err); 
    res.status(502).send(u.msg_502());
}); 
 
});



  /* ------------- End Controller Functions ------------- */

module.exports = router;