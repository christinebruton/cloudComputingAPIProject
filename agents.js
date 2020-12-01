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
      //post agent
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
  
    // get owner's labs
    console.log ("In GET/agents")
    const agents = u.gas(req, req.user.sub) 
  .then( (agents) => {
        res.status(200).json(agents);
    });
  }
  });

  /* ------------- End Controller Functions ------------- */

module.exports = router;