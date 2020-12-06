const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');

const datastore = ds.datastore;

const LAB = "Lab";
const AGENT = "Agent";
const BOAT = "Boat";
const SCIENTIST = "Scientist";


router.use(bodyParser.json());


//**********************************************************************************/
//          GENERAL HELPER FUNCTIONS
//**********************************************************************************/




// formats and returns a lab

function pass_a_lab(lab, req){
 
    queryData = {
       id: req.params.id,
       name: lab[0]['name'],
       containment_level: lab[0].containment_level,
       square_footage: lab[0].square_footage,
       agent:lab[0].stored_agents, 
       owner:lab[0].owner,
       self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + req.params.id 
   };
   return queryData;
}

//
// Compares owner of entity with id in jwt
//
function owner_confirm(entity, jwt_id){
    console.log("In owner_confirm entity id " + entity[0].owner + " jwt_id "+jwt_id);
    if (entity[0].owner !== jwt_id){
        return false;
    }else{
        return true;
    }
}


//
// This is just to load the req elements for global use
//

var get_owner_id = function (req, res, next) {
    console.log ("In get_owner_id req = "+ req)
    req_owner_id = req.params.owner_id;
  
    next()
  }

//
// helper function used to create errors if an entity does not exist
//

async function check_if_entity_exists(keyObj){
  
    try {
        console.log ("in Check")
        const entity = await datastore.get(keyObj);
        console.log ("check_if_entity_exists" + JSON.stringify(entity))
        return entity;
    } catch (error) {
        console.log('check_if_entity_exists: caught ' + error);
        throw error;
    }
}

//-------------------------------------
// compare_keys: checks to make sure there are no 
// extra or incorrect parameters in the request
// Used with PUT
//-------------------------------------
function compare_keys(req_body){
    var key_array = JSON.stringify(Object.keys(req_body));
    key_to_compare = {"name":"name", "containment_level":"containment_level" , "square_footage":"square_footage"};
     
    var compare_key = JSON.stringify(Object.keys((key_to_compare)));
    console.log ("compare_keys: key to compare against "+ compare_key + "from request "+ key_array )
 
    if (key_array.includes("id")){
        console.log ("compare_keys: returning 1 - cannot change ID")
        return 1; 
    }else if (key_array !== compare_key) {
        console.log ("compare_keys: returning 2 - invalid keys")
        return 2;
    }else if (key_array === compare_key){   
        console.log ("compare_keys:returning 3 - valid keys")
        return 3;
    }
}

//**********************************************************************************/
//          LAB HELPER FUNCTIONS
//**********************************************************************************/

//
// LAB PUT HELPER FUNCTION
// Used to put agent into LAB

async function put_stored_agent_into_lab(l_id, a_id){
    console.log ("put_stored_agent_into_lab: Adding agent: " + a_id + "to lab: "+ l_id)
    const l_key = datastore.key([LAB, parseInt(l_id,10)]);
    const lab = await datastore.get(l_key);
    console.log ("lab[0].stored_agents "+  lab[0].stored_agents + "lab[0].stored_agents[0].id keys "+ JSON.stringify(lab[0].stored_agents[0]));
    if (typeof (lab[0].stored_agents) === 'undefined' ) {
        lab[0].stored_agents = [];
    }
    if (lab[0].stored_agents[0] === null ) {
        lab[0].stored_agents = [];
    }

    lab[0].stored_agents.push(a_id);
    console.log("put_agent_lab after lab[0].stored_agents.push(a_id) " + JSON.stringify(lab[0].stored_agents));
    return datastore.save({ "key": l_key, "data": lab[0] });

}

//put lab into agent 
async function put_home_lab_into_agent(l_id, a_id){
    const a_key = datastore.key([AGENT, parseInt(a_id,10)]);
    const l_key = datastore.key([LAB, parseInt(l_id,10)]);
    const agent = await datastore.get(a_key);
    agent[0].home_lab.id = l_id;
    console.log("put_agent_lab after agent[0].home_lab.id " + JSON.stringify(agent));
    return datastore.save({ "key": a_key, "data": agent[0] });
}

//delete home lab in agent
async function delete_home_lab_from_agent(a_id){
    const a_key = datastore.key([AGENT, parseInt(a_id,10)]);
    const agent = await datastore.get(a_key);
    agent[0].home_lab.id = "null";
    console.log("put_agent_lab after agent[0].home_lab.id " + JSON.stringify(agent));
    return datastore.save({ "key": a_key, "data": agent[0] });
}



//-------------------------------------
// put_lab: Helper functions to save all parameters
// in the datastore
// Used with PUT
//-------------------------------------

async function put_lab(id, name, containment_level, square_footage, owner){
    const key = datastore.key([LAB, parseInt(id, 10)]);
    console.log ("put_lab:key ", JSON.stringify(key));
    const lab_data = {"name": name, "containment_level": containment_level, "square_footage": square_footage, "owner": owner};
    console.log ("lab_data ", JSON.stringify(lab_data));
       return datastore.save({"key":key, "data":lab_data});
}


//
// LAB POST HELPER FUNCTION
// Takes in parameters and saves lab entity in datastore
// also posts owner as a scientist if it isn't already listed in the db
//

async function post_lab(name, containment_level, square_footage, owner, user, stored_agents){

    var noDupSci;
    console.log("user "+ JSON.stringify(user))
    //see if req.user.sub exists
    noDupSci = await scientist_find(owner)
    console.log ("No scientist in the db yet, ok to add  " + JSON.stringify(noDupSci))
    //if a scientist does exist does just add it as an owner in the lab
    if (noDupSci == false){
            //move on with function
    }else if (noDupSci == true)
    //if scientist doesn't exist
    {
        post_scientist(user,owner)
    }
    
    var key = datastore.key(LAB);
	const new_lab = {"name": name, "containment_level": containment_level, "square_footage": square_footage,  "owner": owner , "stored_agents": stored_agents};
    console.log ("post_lab: new lab "+ new_lab);
    await datastore.save({ "key": key, "data": new_lab });
    return key;
}

//
// INPUT VALIDATION
// FOR LAB checks to make sure all parameters have been included
//

function lab_params_ok (req){    
    const reqName = req.body.name;
    const reqCL = req.body.containment_level;
    const reqSF = req.body.square_footage;
    if (!reqSF || !reqCL || !reqName){
        return false
    }else{
        return true
    }
}

//
// INPUT VALIDATION
// FOR LAB checks to make sure all parameters have been included
//

function lab_SF_type_validation (req){
    var request_bool = true;
    const str_name=req.body.name;
    
    if (typeof(req.body.square_footage) !== "number"){
        request_bool=false;
    }
 
    //returns bool to be used by calling function
    return request_bool;
}

//
// INPUT VALIDATION
// FOR LAB checks to make sure all containment level is one of 4 types:
// BSL1, BSL2, BSL3, BSL4
//

function containment_level_validation(req){
    var found = true;
    let lab_containment_level = ["BSL1", "BSL2", "BSL3", "BSL4"]
    if (lab_containment_level.includes(req.body.containment_level)== true){
        found = true;
    }else if (lab_containment_level.includes(req.body.containment_level)==false){
        found = false; 
    }
    return found;
}

//
// INPUT VALIDATION
// FOR LAB user to make sure a name is not used twice
//

async function unique_query(req){
    
    var name_is_unique;
    const query = datastore
    .createQuery('Lab')
    .filter('name', '=', req.body.name)

    const [labs] =  await datastore.runQuery(query);
    num_of_labs=labs.length;
    if (num_of_labs > 0){
        name_is_unique =  false;
    }else if (num_of_labs == 0){
        name_is_unique = true;
    }
 return name_is_unique
}

//MIGHT NOT BE WORKING
// used with POST to return formatted lab info
// FOR LAB, formats and returns info from the posted lab
//

function return_posted_lab_data(key, req){
    
    resData = {
        id: key.id,
        name: req.body.name,
        containment_level: req.body.containment_level,
        square_footage: req.body.square_footage,
        stored_agents:req.body.stored_agents,
        owner: req.user.sub,
        self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + key.id 
};

return resData;
}

//
// used with GET/labs to return formatted lab info
// FOR LAB, formats and returns info from the posted lab
//

async function get_labs(req,owner){

    var q = datastore.createQuery(LAB).limit(5);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
	const entities = await datastore.runQuery(q);
    results.labs = entities[0].map(ds.fromDatastore).filter(item => item.owner === owner);
    if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
        results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
    }
    return results;

}

//
// used with GET/:lab_id to return formatted lab info
// FOR LAB, formats and returns info from the posted lab
//

async function get_lab(id, owner){
    const key = datastore.key([LAB, parseInt(id,10)]);
    const data = await datastore.get(key);
    return ds.fromDatastore(data[0]);
}

//delete lab helper
function delete_lab(keyObj){
    console.log ("delete_lab "+ JSON.stringify(keyObj))
       return datastore.delete(keyObj);
}

//
// INPUT VALIDATION
// FOR LAB checks to make sure all parameters have been included
//

function risk_group_validation(req){
    var found = true;
    let risk_group = ["RG1", "RG2", "RG3", "RG4"]
    if (risk_group.includes(req.body.risk_group== true)){
        found = true;
    }else if (risk_group.includes(req.body.risk_group)==false){
        found = false; 
    }
    return found;
}

//
// INPUT VALIDATION
// FOR LAB checks to make sure correct number of parameters have been included
//

function count_keys(req_body){
    var key_array = Object.keys(req_body);
    //console.log("requested key array " + key_array );
    requested_key_num = key_array.length;
    required_key_num = 3;
    
    if (key_array.includes("id")){
        return 1; 
    }else if (requested_key_num > required_key_num) {
        return 2;
    }else if (requested_key_num <= required_key_num){   
        return 3;
    }
}

//**********************************************************************************/
//          AGENT HELPER FUNCTIONS
//**********************************************************************************/

//
// INPUT VALIDATION
// FOR AGENT checks to make sure correct number of parameters have been included
//

function count_keys_agent(req_body){
    var key_array = Object.keys(req_body);
    //console.log("requested key array " + key_array );
    requested_key_num = key_array.length;
    required_key_num = 3;
    
    if (key_array.includes("id")){
        return 1; 
    }else if (requested_key_num > required_key_num) {
        return 2;
    }else if (requested_key_num <= required_key_num){   
        return 3;
    }
}

//
// LAB: which keys to update
//
async function which_keys_to_update(req){
    
    var key_array = Object.keys(req.body);
    var reqBody = req.body;
    const l_key = datastore.key([LAB, parseInt(req.params.lab_id,10)]);
    const lab  = await datastore.get(l_key);
    var name_var, containment_level_var, square_footage_var, owner_var ;
    console.log ("which_keys_to_update: lab after datastore get "+ JSON.stringify(lab) )
    //    
    //Check for Name
    //
    //if there is not a name in request
    if (typeof(reqBody.name) === 'undefined'){
        //load the current value back into name var for later use
        name_var=lab[0].name;
    //if there is a name in the request
    }else if (typeof(lab[0].name) !== 'undefined'){
    //load the new name into name var
        name_var=reqBody.name 
    }
    //    
    //Check for containment_level
    //
    if (typeof(reqBody.containment_level) === 'undefined'){
        containment_level_var = lab[0].containment_level;
    //if array includes name, load req param into variable
    }else if (typeof(reqBody.containment_level) !== 'undefined'){
        containment_level_var = reqBody.containment_level;
    }
    //    
    //Check for square_footage
    //
    if (typeof(reqBody.square_footage) ==='undefined'){
        square_footage_var=lab[0].square_footage 
    }
    //if array includes square_footage, load req param into variable
    else if (typeof(reqBody.square_footage) !=='undefined'){
        square_footage_var =reqBody.square_footage;
    }
    owner_var=lab[0].owner;
    console.log ("LAB: which keys to update: owner_var " + owner_var)

  
        //load new variables into the database
        //var name_var, containment_level_var, square_footage_var, owner_var ;

        lab[0].name = name_var;
        lab[0].containment_level=containment_level_var;
        lab[0].square_footage=square_footage_var;
        lab[0].stored_agents=lab[0].stored_agents
        lab[0].owner=owner_var;

        console.log ("Which keys: vars after loading lab owner "+ JSON.stringify(lab[0].owner));
     

    console.log("Which keys: lab[0] "+ JSON.stringify(lab[0].owner));
    return datastore.save({ "key": l_key, "data": lab[0] });

}

//-------------------------------------
// put_agent: Helper functions to save all parameters
// in the datastore
// Used with PUT
//-------------------------------------

async function put_agent(res, id, name, risk_group, type, owner, home_lab){
    const key = datastore.key([AGENT, parseInt(id, 10)]);
    console.log ("key ", JSON.stringify(key))
    const agent_data = {"name": name, "risk_group": risk_group, "type": type, "home_lab": home_lab, "owner": owner};
    console.log ("agwnr_data ", JSON.stringify(agent_data));
       return datastore.save({"key":key, "data":agent_data});
}


//-------------------------------------
// compare_keys: checks to make sure there are no 
// extra or incorrect parameters in the request
// Used with PUT
//-------------------------------------
function compare_keys_agent(req_body){
    var key_array = JSON.stringify(Object.keys(req_body));
    key_to_compare = {"name":"name", "lab":"lab","risk_group":"risk_group" , "type":"type" };
     
    var compare_key = JSON.stringify(Object.keys((key_to_compare)));
    console.log ("compare_keys_agent: key to compare against "+ compare_key + "from request "+ key_array )
 
    if (key_array.includes("id")){
        console.log ("returning 1")
        return 1; 
    }else if (key_array !== compare_key) {
        console.log ("returning 2")
        return 2;
    }else if (key_array === compare_key){   
        console.log ("returning 3")
        return 3;
    }
}


// formats and returns an agent

function pass_agent(agent, req){
    queryData = {
       id: req.params.id,
       name: agent[0]['name'],
       risk_group: agent[0].risk_group,
       type: agent[0].type,
       owner: agent[0].owner,
       home_lab: agent[0].home_lab,
       self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + req.params.id 
   };
   return queryData;
}

//
// INPUT VALIDATION
// FOR AGENT checks to make sure all risk group level is one of 4 types:
// RG1, RG2, RG3, RG4
//

function agent_params_ok (req){    
    const reqName = req.body.name;
    const reqRG = req.body.risk_group;
    const reqType = req.body.type;
    if (!reqType || !reqRG || !reqName){
        return false
    }else{
        return true
    }
}

//
// AGENT POST HELPER FUNCTION
// Takes in parameters and saves agent entity in datastore
//

async function post_agent(name, home_lab, risk_group, type, owner, user){
    var noDupSci;
    console.log("user "+ JSON.stringify(user))
    
    noDupSci = await scientist_find(owner)

    console.log ("post_agent: owner "+ owner);
    console.log ("No scientist in the db yet, ok to add  " + JSON.stringify(noDupSci))
    
      //if a scientist does exist does just add it as an owner in the lab
      if (noDupSci == false){
        //move on with function
    }else if (noDupSci == true)
    //if scientist doesn't exist
    {
        post_scientist(user, owner)
    }
        
    var key = datastore.key(AGENT);
	const new_agent = {"name": name,"home_lab": home_lab, "risk_group": risk_group, "type": type,  "owner":owner };
    await datastore.save({ "key": key, "data": new_agent });
    return key;
}



//delete agent helper
function delete_agent(keyObj){
    console.log ("delet_agent "+ JSON.stringify(keyObj))
       return datastore.delete(keyObj);
}




//
// used with POST to return formatted agent info
// FOR AGENT, formats and returns info from the posted agent
//

function return_posted_agent_data(key, req){
    
    resData = {
        id: key.id,
        name: req.body.name,
        risk_group: req.body.risk_group,
        type: req.body.type,
        owner: req.user.sub,
        home_lab: req.body.home_lab,
        self: req.protocol + "://"+ req.get("host") + req.baseUrl + "/" + key.id 
};

return resData;
}

//
// used with GET/agents to return formatted lab info
// FOR AGENT, formats and returns info from the posted lab
//

async function get_agents(req,owner){

    var q = datastore.createQuery(AGENT).limit(5);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
	const entities = await datastore.runQuery(q);
    results.agents = entities[0].map(ds.fromDatastore).filter(item => item.owner === owner);
    if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
        results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
    }
    return results;

}



//
// AGENT: which keys to update
//
async function which_agent_keys_to_update(req){
   
    var key_array = Object.keys(req.body);
    var reqBody = req.body;
    const a_key = datastore.key([AGENT, parseInt(req.params.agent_id,10)]);
    const agent  = await datastore.get(a_key);
    var name_var, risk_group_var, type_var, lab_var ;

    //    
    //Check for Name
    //
    //if there is not a name in request
    if (typeof(reqBody.name) === 'undefined'){
        //load the current value back into name var for later use
        name_var=agent[0].name;
    //if there is a name in the request
    }else if (typeof(agent[0].name) !== 'undefined'){
    //load the new name into name var
        name_var=reqBody.name 
    }

    //    
    //Check for containment_level
    //
    if (typeof(reqBody.risk_group) === 'undefined'){
        risk_group_var = agent[0].risk_group;
    //if array includes name, load req param into variable
    }else if (typeof(reqBody.risk_group) !== 'undefined'){
        risk_group_var = reqBody.risk_group;
    }

    //    
    //Check for type
    //
    if (typeof(reqBody.type) ==='undefined'){
        type_var=agent[0].type; 
    }
    //if array includes type, load req param into variable
    else if (typeof(reqBody.type) !=='undefined'){
        type_var =reqBody.type;
    }
     //    
    //Check for lab
    //
    if (typeof(reqBody.home_lab) ==='undefined'){
        lab_var=agent[0].home_lab; 
    }
    //if array includes agent, load req param into variable
    else if (typeof(reqBody.agent) !=='undefined'){
        lab_var =reqBody.home_lab;
    }
        //load new variables into the database
        console.log ("inside vars" +name_var+risk_group_var+type_var+lab_var);
        agent[0].name = name_var;
        agent[0].risk_group=risk_group_var;
        agent[0].type=type_var;
        agent[0].home_lab=lab_var;

    console.log("agent[0] "+ JSON.stringify(agent[0]));
    return datastore.save({ "key": a_key, "data": agent[0] });

}

//**********************************************************************************/
//          SCIENTIST HELPER FUNCTIONS
//**********************************************************************************/


async function post_scientist(user, owner){
    console.log ("post_scientist: user.name "+ user.name + "user "+ JSON.stringify(user));
    var key = datastore.key(SCIENTIST);
	const new_agent = {"name": user.name,"id": owner };
    await datastore.save({ "key": key, "data": new_agent });
    return key;
}


//used to find out if it's ok to add a new scientst to the db
async function scientist_find(owner){
    console.log("In scientist_find req.owner_id "+ owner )
    var can_add_sci;
    const query = datastore
    .createQuery('Scientist')
    .filter('id', '=', owner)

    const [scientists] =  await datastore.runQuery(query);
    num_of_sci=scientists.length;
    if (num_of_sci > 0){
        can_add_sci =  false;
    }else if (num_of_sci == 0){
        can_add_sci = true;
    }
 return can_add_sci
}




async function get_scientists(req){
    var q = datastore.createQuery(SCIENTIST).limit(5);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){ //if there is a cursor
        q = q.start(req.query.cursor); //set the start point of the query to that cursor location
    }
    const entities = await datastore.runQuery(q);
    results.all_scientists = entities[0];
    if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
        results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
    }
    return results;
}

//**********************************************************************************/
//          Error messages
//**********************************************************************************/


//custom error messages
errorMsg = {
    msg_400 : function(){
        return {"Error":"The request does not meet the requirements"};
    },
    msg_401 : function(){
        return {"Error":"Missing or invalid JWT"};
    },
    msg_403: function(){
        return {"Error":"This is a violation of the uniqueness constraint"};
    },
    msg_403_agent_added: function(){
        return {"Error":"Agent already has a home_lab"};
    },
    msg_405: function(){
        return {"Error":"Method cannot be used at this endpoint "};
    },
    msg_406: function(){
        return {"Error":"Content type not offered"};
    },
    msg_415: function(){
        return {"Error":"Server only accepts application/json data"};
    },
    msg_500: function(){
        return {"Error":"Internal Server Error"};
    },
    msg_502: function(){
        return {"Error":"Invalid request"};
    },
}

//**********************************************************************************/
//          MODULE EXPORTS
//**********************************************************************************/

// Error messages
module.exports.msg_400=errorMsg.msg_400;
module.exports.msg_400_w_n_p=errorMsg.msg_400_Wrong_num_of_P;
module.exports.msg_403=errorMsg.msg_403;
module.exports.msg_403_a_a=errorMsg.msg_403_agent_added
//module.exports.msg_404=errorMsg.msg_404;
module.exports.msg_405=errorMsg.msg_405;
module.exports.msg_406=errorMsg.msg_406;
module.exports.msg_415=errorMsg.msg_415;
module.exports.msg_500=errorMsg.msg_500; 
module.exports.msg_502=errorMsg.msg_502; 
//-------------------


module.exports.comp_k=compare_keys;
module.exports.u_name=unique_query;
module.exports.oc=owner_confirm;

module.exports.gls=get_labs;
module.exports.gl=get_lab;
module.exports.pass_l=pass_a_lab;
module.exports.delete_l = delete_lab;
module.exports.c_level_valid=containment_level_validation;
module.exports.l_SF_t_v=lab_SF_type_validation;
module.exports.l_p_ok = lab_params_ok;

module.exports.goi=get_owner_id;
module.exports.pl=post_lab;
module.exports.ret_l=return_posted_lab_data;
module.exports.check=check_if_entity_exists;

//agent helpers
module.exports.gas=get_agents;
module.exports.delete_a=delete_agent;
module.exports.a_p_ok = agent_params_ok;
module.exports.r_g_v=risk_group_validation;
module.exports.ret_a=return_posted_agent_data;
module.exports.pa=post_agent;
module.exports.pass_a=pass_agent;
module.exports.comp_k_a=compare_keys_agent;
module.exports.put_a=put_agent;
module.exports.count_k_a=count_keys_agent;
module.exports.which_a_k=which_agent_keys_to_update;

module.exports.get_sci=get_scientists;
module.exports.ps=post_scientist;
//module.exports.c_f_d=check_for_double

//LAB PUT HELPERS
//put a lab in to an agent
module.exports.p_sa_l=put_stored_agent_into_lab;
//put an agent into a lab
module.exports.put_hl_a=put_home_lab_into_agent;
module.exports.delete_hl_a=delete_home_lab_from_agent;
module.exports.count_k=count_keys;
module.exports.put_l=put_lab;

//LAB PATCH HELPERS
module.exports.which_k=which_keys_to_update;