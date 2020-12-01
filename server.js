const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const ds = require('./datastore');
const request = require('request')

const datastore = ds.datastore;

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa')

const LAB = "Lab";
const router = express.Router();

//from Auth0 "portfoilio login page" app
// const CLIENT_ID = 'UeSomrOASSJ563aAEXfAOEsIJPwrqpEo';
// const CLIENT_SECRET = 'CkGcW8t8q_dKwg5qIqhiLa7GjGcgYUkXSTDYP3OXNVWlvYB7MLThcl0n9lntNc6d';
// const DOMAIN = 'dev-uixvnmr3.us.auth0.com';
// var req_owner_id;

const u = require('./utilities.js')
const l = require('./labs.js')

//added per slack to allow for https protocol
app.enable('trust proxy');

app.use(bodyParser.json());

//may not be needed
function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
  }
  

/* ------------- End Controller Functions ------------- */

app.use('/', require('./index'));


//
// CheckJWT error handling
//

app.use(function (err, req, res, next) {


    //DELETE unauthorized token
    if (err.name === 'UnauthorizedError' && req.method == "DELETE" ) {
      console.log ("UnauthorizedError: DELETE req keys");
      res.status(401).send({'Error' : 'Missing or invalid JWT'});
    }
   //GET unauthorized token   
    else if(err.name === 'UnauthorizedError' && req.method == "GET" && !req.originalUrl.includes("owner")) {
     console.log ("UnauthorizedError: Get/BOATS" + JSON.stringify(req.originalUrl) + " contains owners " + req.originalUrl.includes("owner"));
     const boats = u.gpb(req_owner_id)
     .then( (boats) => {
           res.status(200).json(boats);
       }); 
    
     }
   //GET/owner: unauthorized token  
    else if(err.name === 'UnauthorizedError' && req.originalUrl.includes("owner")  ){
      console.log ("UnauthorizedError: Get/OWNER ");
  
      const boats = u.gopb(req_owner_id)
      .then( (boats) => {
     
            res.status(200).json(boats);
        }); 
     }
  
     //POST: unauthorized token 
    else if (err.name === 'UnauthorizedError' && req.method == "POST" ) {
      console.log ("UnauthorizedError: POST");
      res.status(401).send({'Error' : 'Missing or invalid JWT'});
    }
    //other errors
    else {
      console.error(err.stack)
      res.status(500).send('Something broke!')
    }
  })


// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});