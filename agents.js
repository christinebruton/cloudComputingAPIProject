const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');
const u = require('./utilities.js')
const datastore = ds.datastore;
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa')
const DOMAIN = 'dev-uixvnmr3.us.auth0.com';
var accepts = require('accepts')

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
// POST AGENT
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

      //console.log ("is there a double "+ u.c_f_d);
      //u.ps(req.user.name,req.user.sub)
    //};
      u.pa(req.body.name, req.body.home_lab, req.body.risk_group, req.body.type, req.user.sub, req.user)

        .then( key=>
             res.status(201).send(u.ret_a(key, req))).catch((error) => {
              console.error("POST/ ERR: " + error);
            });
    
    }
});

//
// GET ALL AGENTS
//If the supplied JWT is valid, return 200 status code and all agents whose owner matches the "sub" property in the supplied JWT
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
  // PUT: Update agent
  //
  router.put('/:agent_id', checkJwt, function(req, res){
  console.log ("IN PUT agent")

  const agent_key = datastore.key([AGENT, parseInt(req.params.agent_id,10)]);
  console.log ("agent_key "+ JSON.stringify(agent_key))
  var valid_input = true; 
  switch (u.comp_k_a(req.body)){
    case 1:
      console.log("PUT comp_k_a returns: case 1");
        valid_input = false;
        break;
    case 2:
      console.log("PUT comp_k_a returns: case 2");
        valid_input =false;
        break;
    case 3:
      console.log("PUT comp_k_a returns: case 3");
        valid_input=true;
        break;
    default:
      console.log("PUT comp_k_a returns: default");
        valid_input=true;
  }
  if (valid_input == false)
  {
      console.log("PUT:Valid_input == false")
      res.status(400).send(u.msg_400());
  }else if (valid_input == true){
    console.log("PUT: Valid_input == true lab "+ JSON.stringify(req.body))
    console.log("PUT: res "+ res+ " req.params.agent_id " + req.params.agent_id + " req.body.name " + req.body.name+ " req.body.risk_group "+ req.body.risk_group+ " req.body.type " + req.body.type +" req.body.lab"+ JSON.stringify(req.body.lab))
   u.put_a(res, req.params.agent_id, req.body.name, req.body.risk_group, req.body.type, req.user.sub, req.body.lab) 
   .then(
    datastore.get(agent_key,(err, agent)=>{ 
        if (!err){
        console.log ("Object.keys "+ Object.keys(agent))
        console.log ("AGENT agent "+ JSON.stringify(agent.lab))
        console.log (agent['name'])
        queryData = {
                        id: agent_key.id,
                        name: agent.name,
                        risk_group: agent.risk_group,
                        type: agent.type,
                        home_lab: agent.home_lab,
                        owner: agent.owner,
                        self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + agent_key.id 
                    };
                    console.log("agent.name "+ agent['name'])
                    //res.status(303)
                    res.status(204).json(queryData);
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
  // PATCH: Update agent
  //
  router.patch('/:agent_id', checkJwt, function(req, res){
  console.log ("IN PATCH")
  const agent_key = datastore.key([AGENT, parseInt(req.params.agent_id,10)]);
  
   var valid_input; 
       switch (u.count_k_a(req.body)){
        case 1:
            console.log("case 1")
            valid_input = false;
            break;
        case 2:
          console.log("case 2")
            valid_input =false;
            break;
        case 3:
          console.log("case 3")
            valid_input=true;
            break;
        default:
          console.log("default")
            valid_input=true;
       } if (valid_input == false){
           res.status(400).send(u.msg_400());
       }else if (valid_input == true){
           //the request is valid, update parameters
           u.which_a_k(req).then(
               datastore.get(agent_key,(err, agent)=>{
                 //change to req data 
                   if (!err){
                    queryData = {
                      id: agent_key.id,
                      name: agent.name,
                      risk_group: agent.risk_group,
                      type: agent.type,
                      home_lab: agent.home_lab,
                      owner: agent.owner,
                      self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + agent_key.id 
                  };
                  console.log("agent.name "+ agent['name'])
                       res.status(204).json(queryData);
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
// GET AGENT
// get agent by ID
//
router.get('/:agent_id', checkJwt, function(req, res, next){
  console.log ("in get/agent id " + req.params.agent_id)
  const agent_key = datastore.key([AGENT, parseInt(req.params.agent_id,10)]);
  
  console.log ("in get: agent id key " + JSON.stringify(agent_key));
  const accepts = req.accepts(['application/json']);
  console.log ("accepts is "+ accepts)
  if (!accepts){
      console.log("GET: request is not of acceptable type")
      res.status (406).send(u.msg_406())
  }else {
  u.check(agent_key).then( agent =>{
      if (agent[0].owner==req.user.sub){

            //confirm owner is correct
            // console.log(u.oc(agent, req.user.sub));
            console.log("get/:agent_id. JWT id " + req.user.sub + " agent owner from db "+ agent[0].owner);
            console.log("in get: returned agent " + JSON.stringify(agent) );
            //return formatted agent
            res.status(200).json(u.pass_a(agent, req));

            }else if (agent[0].owner != req.user.sub) {
              res.status(403).send(u.msg_403());
            }
  
        });    
      }
   });

//
// delete agent
//

router.delete('/:agent_id', checkJwt, function(req, res, err){
  console.log("In DELETE /agents/:agent_id "+req.params.agent_id )
  const key = datastore.key([AGENT, parseInt(req.params.agent_id,10)]);

  u.check(key).then((agent)=>{

    if (agent.owner == req.user.sub){

        console.log('In router.delete  ' + JSON.stringify(agent[0].owner) + "user id " +req.user.sub );  
      
        if (agent ===null || typeof agent === 'undefined'){
          res.status(403).send(u.msg_403());
          console.log ("it's null");
        }else  if (agent[0].owner != req.user.sub)  {
          res.status(401).send(u.msg_401());
        }else {
          u.delete_a(key).then(res.status(204).end())
        }
      }else{
        res.status(403).send(u.msg_403()); 
      }
  }).catch((err)=>{
    console.log('In router.delete  caught ' + err); 
    res.status(502).send(u.msg_502());
}); 
 
});

//unallowed routes
router.delete('/', function (req, res){
  res.set('Accept', 'GET, POST');
  res.status(405).end();
});

router.put('/', function (req, res){
  res.set('Accept', 'GET, POST');
  res.status(405).end();
});


  /* ------------- End Controller Functions ------------- */

module.exports = router;