const passport = require("passport");
const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

module.exports = function(app, db){
    passport.use(new LocalStrategy(
        function(username, password, done) {
          db.collection('users').findOne({username: username}, function(err, user) {
            console.log(`User ${username} attempted to log in.`);
            if (err) {
              console.error({'Auth failure': err})
              return done (err);
            }
            if(!user){
              console.error({'User auth failed': username})
              return done(null, false);
            }
            if(!bcrypt.compareSync(password, user.password)) {
              console.log("Successful Auth!");
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
            (err, user) => {
              done(null, user);
            }
            )
          });
}