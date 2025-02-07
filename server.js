const express = require('express');
const app = express();
const userRoutes = require('./routes/user.js');
const adminRoutes = require('./routes/admin.js');
const path = require('path');
const connectDB = require('./db/connectDB.js');
const session = require('express-session');
const nocache = require('nocache');
const passport = require('passport');
const User = require('./model/user_model');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const {StatusCodes,Messages } = require("./controller/statusCode");



require('dotenv').config();
var GoogleStrategy = require('passport-google-oauth20').Strategy;

// Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://havencraft.myvnc.com/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          username: profile.displayName,
          email: profile.emails?.[0]?.value, 
          profilePic: profile.photos?.[0]?.value 
        });
      }
      return cb(null, user);
    } catch (err) {
      return cb(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
    done(null, user.id); 
});
  

passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id); 
      done(null, user);
    } catch (err) {
      done(err, null);
    }
});


app.get('/', (req, res) => {
  res.redirect('/user'); 
});





app.use(session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));
app.use(flash());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

app.use(passport.initialize());
app.use(passport.session());


app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/user/user_login' }),
    function(req, res) {
      req.session.user = {
        id: req.user._id,       
        username: req.user.username,  
        email: req.user.email,   
      };
  
      res.redirect('/user/user_home');
    }
  );

app.use(nocache());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

app.use('/user', userRoutes);
app.use('/admin', adminRoutes);


app.use((err, req, res, next) => {
  console.error(err.stack);  
  res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).render('user/error', {
      statusCode: err.status || StatusCodes.INTERNAL_SERVER_ERROR,
      message: err.message || Messages.INTERNAL_ERROR
  });
});






connectDB();

app.listen(3001, () => {
    console.log('Server started at 3001');
});
