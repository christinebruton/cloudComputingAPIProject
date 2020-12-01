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



const SCIENTIST = "Scientist";


router.use(bodyParser.json());


//get route
router.get('/', function(req, res){
    const scientists = get_scientists(req)
	.then( (scientists) => {
        res.status(200).json(scientists);
    });
});

/* ------------- End Controller Functions ------------- */

module.exports = router