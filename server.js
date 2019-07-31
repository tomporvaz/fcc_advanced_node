'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session = require("express-session");
const passport = require("passport");
const ObjectID = require('mongodb').ObjectID;
const mongo = require('mongodb').MongoClient;
const LocalStrategy = require('passport-local');
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
  res.render(process.cwd() + '/views/pug/index.pug', 
  {
    title: 'Hello', 
    message: 'Please login',
    showLogin: true,
    showRegistration: true
  });
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));

//login route
const authenticate = passport.authenticate('local', {failureRedirect: '/'});

app.post('/login', authenticate, function(req, res) {
  res.redirect('/profile')
}
)

//ensureAuthenticated middleware checks that user is authenticated so routes are not exposed
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

app.route('/profile')
.get(ensureAuthenticated, (req, res) => {
  res.render(process.cwd() + '/views/pug/profile.pug',
  {
    username: req.user.username
  });
});


//logout route
app.route('/logout')
.get((req, res) => {
  req.logout();
  res.redirect('/');
});






//IN THIS SECTION PASSPORT SERIALIZATION AND DESERIALIZATION HAPPENS
mongo.connect(process.env.DATABASE, (err, db) => {
  if(err){
    console.error('Database error: ' + err);
  } else {
    console.log('Sucessful connection to DB');
    
    passport.use(new LocalStrategy(
      function(username, password, done) {
        db.collection('users').findOne({username: username}, function(err, user) {
          console.log(`User ${username} attempted to log in.`);
          if (err) {
            return done (err);
          }
          if(!user){
            return done(null, false);
          }
          if(password !== user.password) {
            return done(null, false);
          }
          return done (null, user);
        })
      }
      ));
      
      
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
      
      //regisration route
      app.route('/register')
      .post((req, res, next) => {
        db.collection('users').findOne({username: req.body.username}, function(err, user){
          if(err) {
            console.error({'registration error': err})
            next(err);
          } else if(user){
            console.error({'user exists error': err})
            res.redirect('/');
          } else {
            console.log("Sucess, unused username found!")
            db.collection('users').insertOne(
              {
                username: req.body.username,
                password: req.body.password
              },
              (err, doc) => {
                console.log(doc);
                if(err) {
                  res.redirect('/');
                } else {
                  next(null, user);
                }
              }
              )
            }
          })
        },
        passport.authenticate('local', {failureRedirect: '/'}),
        (req, res, next) => {
          res.redirect('/profile');
        });
        
      });
      
      
      
      
      app.listen(process.env.PORT || 3000, () => {
        console.log("Listening on port " + process.env.PORT);
      });
      
      
      //ALL ROUTES ABOVE HERE
      //404 middleware
      app.use((req, res, next) => {
        res.status(404)
        .type('text')
        .send('not found')
      })