'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session = require("express-session");
const passport = require("passport");
const ObjectID = require('mongodb').ObjectID;
const mongo = require('mongodb').MongoClient;

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug')
app.use(passport.initialize());
app.use(passport.session());

app.route('/')
  .get((req, res) => {
    res.render(process.cwd() + '/views/pug/index.pug', {title: 'Hello', message: 'Please login'});
  });

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));

//IN THIS SECTION PASSPORT SERIALIZATION AND DESERIALIZATION HAPPENS
mongo.connect(process.env.DATAPASE, (err, db) => {
  if(err){
    console.error({'Database error: ' + err});
  } else {
    console.log('Sucessful connection to DB');
    passport.serializeUser((user, done) => {
      done(null, user._id);
    });
    
    passport.deserializeUser((id, done) => {
     db.collection('users').findOne(
        {_id: new ObjectID(id)},
        (err, doc) => {
          done(null, doc);
        }
        )
      });

  }
})




app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
