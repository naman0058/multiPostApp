const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: process.env.CALLBACK_URL
},
function(token, tokenSecret, profile, done) {
  // Store user details (Twitter ID, tokens) in the database
  User.findOrCreate({ twitter_id: profile.id }, {
    username: profile.username,
    access_token: token,
    token_secret: tokenSecret
  }).then(user => {
    return done(null, user);
  });
}
));



passport.use(new LinkedInStrategy({
  clientID: 'YOUR_LINKEDIN_CLIENT_ID',
  clientSecret: 'YOUR_LINKEDIN_CLIENT_SECRET',
  callbackURL: 'http://localhost:3000/auth/linkedin/callback',
  scope: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
  state: true
}, function (accessToken, refreshToken, profile, done) {
  // Store the LinkedIn accessToken for later use
  const user = { linkedinId: profile.id, accessToken: accessToken };

  db.query('INSERT INTO users SET ?', user, function (err, res) {
      if (err) throw err;
      return done(null, user);
  });
}));




passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id).then(user => done(null, user));
});



