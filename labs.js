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
const AGENT = "Agent";


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
  console.log ("here's what's in stored agents "+req.body.stored_agents);
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
        res.status(403).send(u.msg_403_u_l()); 
    }else if(bool == true) {
      u.pl(req.body.name, req.body.containment_level, req.body.square_footage, req.user.sub, req.user, req.body.stored_agents )  
   
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
// PUT: Update lab
//
router.put('/:lab_id', checkJwt, function(req, res){
  console.log ("IN PUT LAB")

  const lab_key = datastore.key([LAB, parseInt(req.params.lab_id,10)]);
  console.log ("PUT LAB:lab_key "+ JSON.stringify(lab_key))
  var valid_input = true; 
  switch (u.comp_k(req.body)){
    case 1:
      console.log("PUT LAB: comp_k returns: case 1: tried to change ID");
        valid_input = false;
        break;
    case 2:
      console.log("PUT LAB: comp_k returns: case 2: invalid keys");
        valid_input =false;
        break;
    case 3:
      console.log("PUT LAB: comp_k returns: case 3: valid kyes");
        valid_input=true;
        break;
    default:
      console.log("PUT LAB: comp_k returns: default");
        valid_input=true;
  }
  if (valid_input == false)
  {
      console.log("PUT LAB:Valid_input == false")
      res.status(400).send(u.msg_400());
  }else if (valid_input == true){
    console.log("PUT LAB: Valid_input == true lab "+ JSON.stringify(req.body));
    console.log("PUT LAB:: res "+ res+ " req.params.lab_id " + req.params.lab_id + " req.body.name " + req.body.name+ " req.body.containment_level "+ req.body.containment_level+ " req.body.square_footage " + req.body.square_footage+" req.body.lab"+ JSON.stringify(req.body.lab));
    
    //returns true if owner is auth and false if not
    //var is_owner_auth = u.ploc(lab_key, req.user.sub);
    //console.log ("PUT is_owner_auth "+ is_owner_auth);
  
   
   
    u.put_l(req.params.lab_id, req.body.name, req.body.containment_level, req.body.square_footage, req.user.sub) 
   .then(
    datastore.get(lab_key,(err, lab)=>{ 
        if (!err){
        console.log ("PUT LAB: Object.keys after datastore get "+ Object.keys(lab))
        console.log ("PUT LAB: stored_agents "+ JSON.stringify(lab.stored_agents))
        console.log (lab['name']);
        // queryData = {
        //                 id: lab_key.id,
        //                 name: lab.name,
        //                 containment_level: lab.containment_level,
        //                 square_footage: lab.square_footage,
        //                 stored_agents: lab.stored_agents,
        //                 owner:lab.owner,
        //                 self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + lab_key.id 
        //             };
        //            console.log("PUT LAB: queryData to send "+ JSON.stringify(queryData));
                    //res.status(303)
        //           res.status(200).json(queryData);

        if (lab.owner === req.user.sub){
          res.sendStatus(204);
        }  else if (lab.owner !== req.user.sub){
          res.status(403).send(u.msg_403());
        }
                    
        }
          else if (err){
          console.log ("PUT LAB: There was an error in sending data")
          res.status(502).send(u.msg_502())
          } 
      })
    ).catch((err)=>{
      console.log('In router.put lab caught ' + err); 
          res.status(403).send({"Error": "You are not the owner of this lab"});
  }); 


}


});


//
// PATCH: Update lab
//
router.patch('/:lab_id', checkJwt, function(req, res){
  console.log ("PATCH LAB")
  const lab_key = datastore.key([LAB, parseInt(req.params.lab_id,10)]);
  
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
               //datastore.get(lab_key,(err, lab)=>{
              //     if (!err){
              //       queryData = {
              //         id: lab_key.id,
              //         name: lab.name,
              //         containment_level: lab.containment_level,
              //         square_footage: lab.square_footage,
              //         stored_agents: lab.stored_agents,
              //         owner:lab.owner,
              //         self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + lab_key.id 
              //     };
              //          console.log("PATCH LAB: lab.name "+ lab.name)
              //         res.status(200).json(queryData);
              //     }
              // else if (err){
               // console.log ("PUT: There was an error in datastore")
              //  res.status(502).send(u.msg_502())
              // } 
              res.status(204).end()
          //  })
           )
       }
   });


   //
// PUT: Update lab-agent relationship
//    
//TODO: make sure you can't change another owner's lab 
router.put('/:lab_id/agents/:agent_id', checkJwt, function(req, res, err){
  const  a_key= datastore.key([AGENT, parseInt(req.params.agent_id,10)]);
  const l_key = datastore.key([LAB, parseInt(req.params.lab_id,10)]);
  u.check(l_key).then(
      lab=>{
     
          u.p_sa_l(req.params.lab_id, req.params.agent_id).then(key=>{console.log ('In router.put after put_stored agent into lab. lab[0].stored_agents '+ JSON.stringify(lab[0].stored_agents))}).catch()
        }).catch((err)=>{
            console.log('In router.put lab caught ' + err); 
                res.status(404).send({"Error": "The specified boat or load does not exist"});
        }); 
      u.check(a_key).then(
          agent=>{
            console.log ("Update lab-agent relationship: In router.put agenthome_lab.id " + agent[0].home_lab.id );
           if (agent[0].home_lab.id == null){
            u.put_hl_a(req.params.lab_id, req.params.agent_id)
              .then(
                  res.status(204).send()); 
           }else {
              console.log ("router.put: agent[0].lab.id after save" + JSON.stringify(agent[0].home_lab.id));
              
              res.status(403).send(u.msg_403_a_a())
           }
  
          }).catch((err)=>{
              console.log('In router.put agent caught ' + err); 
                  res.status(404).send({"Error": "Cannot add relationship, not found"});
          }); 
      });


   //
// DELETE: REMOVE lab-agent relationship
// //TODO: make sure you can't change another owner's lab  

router.delete('/:lab_id/agents/:agent_id', checkJwt, function(req, res, err){
  const  a_key= datastore.key([AGENT, parseInt(req.params.agent_id,10)]);
  const l_key = datastore.key([LAB, parseInt(req.params.lab_id,10)]);
  const agent_id_to_delete = req.params.agent_id;
  const lab_id_to_change = req.params.lab_id;
  console.log ("router.delete('/:lab_id/agents/:agent_id: agent to id to delete'" + agent_id_to_delete )


  console.log ("a_key "+ JSON.stringify(a_key) + "l_key " + JSON.stringify(l_key) );
  u.check(l_key).then(
    lab=>{

      u.delete_s_a_f_e(lab_id_to_change, agent_id_to_delete);  
    
    }).catch((err)=>{
          console.log('In router.put lab caught ' + err); 
              res.status(404).send({"Error": "The specified entity does not exist"});
      }); 

      u.check(a_key).then(
        agent=>{
          console.log ("router.delete('/:lab_id/agents/:agent_id': agent[0]" + JSON.stringify(agent[0]) );
         if (agent[0].home_lab.id == null){
          
          //NO ACTION
          
          //u.put_hl_a(req.params.lab_id, req.params.agent_id)
          //  .then(
          //      res.status(204).send()); 
         }else {
            
            u.delete_hl_a(req.params.agent_id).then(
                   res.status(204).send()); 

            //call function do delete agent 


            //res.status(403).send(u.msg_403_a_a())
         }

        }).catch((err)=>{
            console.log('In router.delete relationship caught ' + err); 
                res.status(404).send({"Error": "The specified entity or entities do not exist"});
        }); 

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
    queryData = {
      id: req.params.lab_id,
      name: lab[0]['name'],
      containment_level: lab[0].containment_level,
      square_footage: lab[0].square_footage,
      stored_agents: lab[0].stored_agents, 
      owner:lab[0].owner,
      self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + req.params.id 
  };
     res.status(200).json(queryData);
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