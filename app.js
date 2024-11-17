var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
require('dotenv').config(); // Load environment variables
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy; 

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// Session configuration
app.use(session({ 
  secret: 'secretKey', // Change this to a more secure secret in production
  resave: false, // Only resave if the session is modified
  saveUninitialized: true // Save uninitialized sessions
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Twitter authentication strategy
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: process.env.CALLBACK_URL,
}, (token, tokenSecret, profile, done) => {
  // Handle the user profile and tokens
  const user = {
    id: profile.id,
    username: profile.username,
    access_token: token,
    token_secret: tokenSecret,
    profile: profile // Store the entire profile if needed
  };
  done(null, user); // Pass the user object to the next middleware
}));


// https://www.linkedin.com/developers/tools/oauth/redirect
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/linkedin/callback',
  scope: ['r_liteprofile', 'r_emailaddress'], // Add scopes as needed
  state: true,
}, function (accessToken, refreshToken, profile, done) {
  const user = {
    id: profile.id,
    username: profile.displayName,
    access_token: accessToken,
    refresh_token: refreshToken,
    profile: profile
  };

  // You can save the user to your database here
  done(null, user);
}));





passport.use(new InstagramStrategy({
  clientID: '441162705660684',
  clientSecret: '93e025dd145211f8b34581b24b6e27a4',
  callbackURL: "/auth/instagram/callback"
},
function(accessToken, refreshToken, profile, done) {
  // const user = {
  //   id: profile.id,
  //   username: profile.displayName,
  //   access_token: accessToken,
  //   refresh_token: refreshToken,
  //   profile: profile
  // };
  console.log('user details',accessToken)
  console.log('user details',refreshToken)
  console.log('user details',profile)


  done(null, user);
}));

// Serialize and Deserialize User
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade'); // Consider using a more modern template engine like EJS or Pug

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Route handlers
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  // Set locals for error handling
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error'); // Ensure you have an error.jade or error.pug template
});

// Export the app
module.exports = app;
