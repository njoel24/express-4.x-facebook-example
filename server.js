var express = require('express');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var request = require('request-promise');

var bodyParser = require('body-parser');

console.log("server start");


var payload = {  
  queryTerm: 'Fiat',
  searchType: 'page'
}

var userToken = "";

// Configure the Facebook strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
// access Token : EAAbBwxujROQBAEwzCCoryetMTZBZCpzVqAcKwbikbsMZCrZA5rWUnjWbpDafspcfPTwqGZC3xuZAdjdrFT1LCEl193akFcNAMsYHDPgGohYIh8EbGNYuvz3SDYTVs2iyWPxb4Y67kl6CUgL8zRyQUSUXREhbrWO7wZD
passport.use(new Strategy({
    clientID: 1901893586732260,
    clientSecret: '3dcfddb16a15c9550a3c8b0a93a246b9',
    callbackURL: '/login/facebook/return'
  },
  function(accessToken, refreshToken, profile, cb) {
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    userToken = accessToken;
    console.log("ecco l'accessToken:"+accessToken)
    return cb(null, profile);
  }));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


// Create a new Express application.
var app = express();



app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// Define routes.
app.get('/',
  function(req, res) {
    res.render('home', { user: req.user });
  });

app.get('/login',
  function(req, res){
    res.render('login');
  });

app.get('/login/facebook',
  passport.authenticate('facebook', { scope: ['publish_actions', 'manage_pages'] }));

app.get('/login/facebook/return', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('profile', { user: req.user });
  });

app.post('/facebook-search', (req, res) => {
  var userFieldSet = 'name, link, is_verified, picture';
  var pageFieldSet = 'name, category, link, picture, is_verified';
  // var queryTerm, searchType  = req.body;
  console.log("req: "+req.body.search);
  var options = {
    method: 'GET',
    uri: 'https://graph.facebook.com/search',
    qs: {
      access_token: userToken,
      q: req.body.search,
      type: req.body.type,
      fields: req.body.type === 'page' ? pageFieldSet : userFieldSet
    }
  };

  request(options)
      .then(fbRes => {
    // Search results are in the data property of the response.
    // There is another property that allows for pagination of results.
    // Pagination will not be covered in this post,
    // so we only need the data property of the parsed response.
        var parsedRes = JSON.parse(fbRes).data; 
        res.json(parsedRes);
      })
});


app.get('/facebook-search/:id', (req, res) => {

  // you need permission for most of these fields
  var userFieldSet = 'id, name, about, email, accounts, link, is_verified, significant_other, relationship_status, website, picture, photos, feed';

  var options = {
    method: 'GET',
    uri: `https://graph.facebook.com/v2.8/${req.params.id}`,
    qs: {
      access_token: user_access_token,
      fields: userFieldSet
    }
  };

  request(options)
    .then(fbRes => {
      res.json(fbRes);
    })
});

function postContent() {
  var id = 'page or user id goes here';  
  var access_token = 'for page if posting to a page, for user if posting to a user\'s feed';

  var postTextOptions = {  
    method: 'POST',
    uri: `https://graph.facebook.com/v2.8/${id}/feed`,
    qs: {
      access_token: access_token,
      message: 'Hello world!'
    }
  };

  request(postTextOptions); 
}
app.listen(3000);
