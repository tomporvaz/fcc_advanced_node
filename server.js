'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session = require("express-session");
const passport = require("passport");
//const ObjectID = require('mongodb').ObjectID;
const mongo = require('mongodb').MongoClient;
//const LocalStrategy = require('passport-local');
const app = express();
//const bcrypt = require('bcrypt');
const routes = require('./routes.js');
const auth = require('./auth.js');

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug')


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Enable to pass the challenge called "Advanced Node and Express - 
// Registration of New Users"
if (process.env.ENABLE_DELAYS) app.use((req, res, next) => {
  switch (req.method) {
    case 'GET':
    switch (req.url) {
      case '/logout': return setTimeout(() => next(), 500);
      case '/profile': return setTimeout(() => next(), 700);
      default: next();
    }
    break;
    case 'POST':
    switch (req.url) {
      case '/login': return setTimeout(() => next(), 900);
      default: next();
    }
    break;
    default: next();
  }
});


mongo.connect(process.env.DATABASE, (err, db) => {
  if(err){
    console.error('Database error: ' + err);
  } else {
    console.log('Sucessful connection to DB');
    
    //call module containg auth logic like authenitcation strategy, serialization and deserialization
    auth(app, db);
    
    //call module that contains all routes and related middleware
    routes(app, db);
    
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
    
  }

});







