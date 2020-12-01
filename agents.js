const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');
const u = require('./utilities.js')
const datastore = ds.datastore;
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa')
const DOMAIN = 'dev-uixvnmr3.us.auth0.com';


const AGENT = "Agent";

router.use(bodyParser.json());

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
// Create an agent
// requires token
//

router.post('/', u.goi, checkJwt, function(req, res){
    var content_type = req.headers['content-type']
    res.set("Content-Type", "application/json")

 //checks that risk group is one allowed by api spec
 if (!u.r_g_v(req)){
  res.status(400).send(u.msg_400());
}
 //determines if number and type of parameters are correct
 else if (u.a_p_ok(req) == false){
  console.log ("wrong params");
  res.status(400).send(u.msg_400());
}
else{
      //post scientist

      console.log ("is there a double "+ u.c_f_d);
      u.ps(req.user.name,req.user.sub)
    //};
      u.pa(req.body.name, req.body.lab, req.body.risk_group, req.body.type, req.user.sub)

        .then( key=>
             res.status(201).send(u.ret_a(key, req))).catch((error) => {
              console.error("POST/ ERR: " + error);
            });
    
    }
});

//
// If the supplied JWT is valid, return 200 status code and all agents whose owner matches the "sub" property in the supplied JWT
// If no JWT is provided or an invalid JWT is provided, return empty brackets
//

router.get('/', checkJwt, function(req, res){
    const accepts = req.accepts(['application/json']);
    console.log ("accepts is "+ accepts)
    if (!accepts){
        console.log("GET: request is not of acceptable type")
        res.status (406).send(u.msg_406())
    }else {
  
    // get owner's agents
    console.log ("In GET/agents")
    const agents = u.gas(req, req.user.sub) 
  .then( (agents) => {
        res.status(200).json(agents);
    });
  }
  });

//
// get agent by ID
//
router.get('/:agent_id', checkJwt, function(req, res, next){
  console.log ("in get/agent id " + req.params.agent_id)
  const agent_key = datastore.key([AGENT, parseInt(req.params.agent_id,10)]);
  
  console.log ("in get: agent id key " + JSON.stringify(agent_key));
 
  u.check(agent_key).then( agent =>{
   console.log(u.oc(agent, req.user.sub)),
    console.log("get/:agent_id. JWT id " + req.user.sub + " agent owner from db "+ agent[0].owner)
    console.log("in get: returned agent " + JSON.stringify(agent) ),
    res.status(200).json(u.pass_a(agent, req));
 });    
});




//
// delete agent
//

router.delete('/:agent_id', checkJwt, function(req, res, err){
  console.log("In DELETE /agents/:agent_id "+req.params.agent_id )
  const key = datastore.key([AGENT, parseInt(req.params.agent_id,10)]);

  u.check(key).then((agent)=>{
    console.log('In router.delete  ' + JSON.stringify(agent[0].owner) + "user id " +req.user.sub );  
   
    if (agent ===null || typeof agent === 'undefined'){
      res.status(403).send(u.msg_403());
      console.log ("it's null");
    }else  if (agent[0].owner != req.user.sub)  {
      res.status(401).send(u.msg_401());
    }else {
      u.delete_a(key).then(res.status(204).end())
    }
  }).catch((err)=>{
    console.log('In router.delete  caught ' + err); 
    res.status(502).send(u.msg_502());
}); 
 
});


  /* ------------- End Controller Functions ------------- */

module.exports = router;