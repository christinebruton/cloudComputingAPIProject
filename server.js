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

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});