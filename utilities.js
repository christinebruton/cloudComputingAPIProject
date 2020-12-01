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
    key_to_compare = {"name":"name", "type":"type" , "length":"length"};
    var compare_key = JSON.stringify(Object.keys((key_to_compare)));
    if (key_array.includes("id")){
        return 1; 
    }else if (key_array !== compare_key) {
        return 2;
    }else if (key_array === compare_key){   
        return 3;
    }
}



//**********************************************************************************/
//          LAB HELPER FUNCTIONS
//**********************************************************************************/

//
// LAB PUT HELPER FUNCTION
// Used to put agent into LAB

function put_lab_agent(l_id, a_id){
    console.log ("Adding agent: " + a_id + "to lab: "+ l_id)
    const l_key = datastore.key([LAB, parseInt(l_id,10)]);
    return datastore.get(l_key)
    .then( (lab) => {
        if (typeof (lab[0].agents) === 'undefined') {
                    lab[0].agents = [];
        }
        lab[0].agents.push(a_id);
        return datastore.save({"key":l_key, "data":lab[0]});
    })

}

//put lab into agent 
async function put_agent_lab(b_id, l_id){
    const a_key = datastore.key([AGENT, parseInt(a_id,10)]);
    const b_key = datastore.key([LAB, parseInt(l_id,10)]);
    const load = await datastore.get(a_key);
    agent[0].lab.id = l_id;
    console.log("put_agent_lab after agent[0].carrier.id = l_id " + JSON.stringify(agent));
    return datastore.save({ "key": a_key, "data": agent[0] });
}







//
// LAB POST HELPER FUNCTION
// Takes in parameters and saves lab entity in datastore
//

async function post_lab(name, containment_level, square_footage, owner){
    console.log ("post_lab: owner "+ owner);
    var key = datastore.key(LAB);
	const new_lab = {"name": name, "containment_level": containment_level, "square_footage": square_footage,  "owner":owner };
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

//
// used with POST to return formatted lab info
// FOR LAB, formats and returns info from the posted lab
//

function return_posted_lab_data(key, req){
    
    resData = {
        id: key.id,
        name: req.body.name,
        containment_level: req.body.containment_level,
        square_footage: req.body.square_footage,
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

//**********************************************************************************/
//          AGENT HELPER FUNCTIONS
//**********************************************************************************/



// formats and returns a lab

function pass_agent(agent, req){
    queryData = {
       id: req.params.id,
       name: agent[0]['name'],
       risk_group: agent[0].risk_group,
       type: agent[0].type,
       owner: agent[0].owner,
       owner: agent[0].lab,
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

async function post_agent(name, lab, risk_group, type, owner){
    console.log ("post_agent: owner "+ owner);
    var key = datastore.key(AGENT);
	const new_agent = {"name": name,"lab": lab, "risk_group": risk_group, "type": type,  "owner":owner };
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
        lab: req.body.lab,
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



//**********************************************************************************/
//          SCIENTIST HELPER FUNCTIONS
//**********************************************************************************/


async function post_scientist(name, id){
    console.log ("post_scientist: "+ name);
    var key = datastore.key(SCIENTIST);
	const new_agent = {"name": name,"id": id };
    await datastore.save({ "key": key, "data": new_agent });
    return key;
}

async function check_for_double(keyObj){
    const entity = await datastore.get(keyObj);
    if (typeof(entity) !== 'undefined'){
        return false;
    }
    else {
        return true;
    }
}




//TODO: change from boats to scientists
async function get_scientists(req){
    var q = datastore.createQuery(SCIENTIST).limit(5);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){ //if there is a cursor
        q = q.start(req.query.cursor); //set the start point of the query to that cursor location
    }
	const entities = await datastore.runQuery(q);
    results.allScientists = entities[0].map(ds.fromDatastore);
    if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
        results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
    }
    return results;
}

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
module.exports.msg_404=errorMsg.msg_404;
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

module.exports.gas=get_agents;
module.exports.delete_a=delete_agent;
module.exports.a_p_ok = agent_params_ok;
module.exports.r_g_v=risk_group_validation;
module.exports.ret_a=return_posted_agent_data;
module.exports.pa=post_agent;
module.exports.pass_a=pass_agent;

module.exports.gss=get_scientists;
module.exports.ps=post_scientist;
module.exports.c_f_d=check_for_double

module.exports.p_l_a=put_lab_agent;