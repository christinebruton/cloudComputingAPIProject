const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');

const datastore = ds.datastore;

const LAB = "Lab";


router.use(bodyParser.json());


//**********************************************************************************/
//          GENERAL HELPER FUNCTIONS
//**********************************************************************************/


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



//**********************************************************************************/
//          LAB HELPER FUNCTIONS
//**********************************************************************************/

//
// LAB POST HELPER FUNCTION
// Takes in parameters and saves lab entity in datastore
//

async function post_lab(name, containment, square_footage, owner){
    console.log ("post_boat: owner "+ owner);
    var key = datastore.key(LAB);
	const new_boat = {"name": name, "containment": containment, "square_footage": square_footage,  "owner":owner };
    await datastore.save({ "key": key, "data": new_boat });
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
    results.items = entities[0].map(ds.fromDatastore).filter(item => item.owner === owner);
    if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
        results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
    }
    return results;

}

//delete boat helper
function delete_lab(keyObj){
    console.log ("delete_lab "+ JSON.stringify(keyObj))
       return datastore.delete(keyObj);
}



//custom error messages
errorMsg = {
    msg_400 : function(){
        return {"Error":"The request does not meet the requirements"};
    },
 
    msg_403: function(){
        return {"Error":"That name already exists"};
    },
    msg_404: function(){
        return {"Error":"No entity with this id exists"};
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
//-------------------
module.exports.u_name=unique_query;
module.exports.gls=get_labs;
module.exports.delete_l = delete_lab;
module.exports.c_level_valid=containment_level_validation;
module.exports.l_SF_t_v=lab_SF_type_validation;
module.exports.l_p_ok = lab_params_ok;
module.exports.goi=get_owner_id;
module.exports.pl=post_lab;
module.exports.ret_l=return_posted_lab_data;
module.exports.check=check_if_entity_exists;
