const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function(app, db){
    app.route('/')
        .get((req, res) => {
          res.render(process.cwd() + '/views/pug/index.pug', 
          {
            title: 'Home Page', 
            message: 'Please login',
            showLogin: true,
            showRegistration: true
          });
        });
        
        
        
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
          } else {
            console.log('user is not authenticated');
            console.log(req);
            res.redirect('/');}
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
      
      //regisration route
      app.route('/register')
      .post((req, res, next) => {

        //hash password
        let hash = bcrypt.hashSync(req.body.password, 12);

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
                password: hash
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

              //ALL ROUTES ABOVE HERE
      //404 middleware
      app.use((req, res, next) => {
        res.status(404)
        .type('text')
        .send('not found')
      })  
      
}