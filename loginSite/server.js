const express = require('express');
const app = express();

require ('dotenv').config();

const { auth, requiresAuth } = require('express-openid-connect');
app.use(
  auth({
    authRequired: false,
    auth0Logout: true,
    issuerBaseURL: process.env.ISSUER_BASE_URL,
    baseURL: process.env.BASE_URL,
    clientID: process.env.CLIENT_ID,
    secret: process.env.SECRET,
    clientSecret:process.env.clientSecret,
    authorizationParams: {
        response_type: 'code id_token',
        //audience: 'http://localhost:8080/profile',
        scope: ' openid profile ',
      },
  })
);



app.get('/', (req,res,next) => {
    const retObj = {
        user:req.oidc.user,
        id_token:req.oidc.idToken 

    };



    res.send (req.oidc.isAuthenticated() ? 'Logged in'+ JSON.stringify(retObj) : 'Logged out');
});

app.get('/profile', requiresAuth(), ( req,res) =>{

    const retObj = {
        user:req.oidc.user,
        id_token:req.oidc.idToken 

    };


    //const str = JSON.stringify(retObj);


    //var loginInfo=JSON.stringify(req.oidc.user);
    //console.log(loginInfo);
    //loginInfo = loginInfo + "ID Token: "+ JSON.stringify(req.oidc.idToken);
    //console.log(loginInfo); 
    console.log(retObj)
    res.send(retObj)
}

)

const port = process.env.PORT || 8080;
app.listen(port, () =>{
    console.log('listening on port ${port}');
});