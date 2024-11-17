const axios = require('axios');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
var express = require('express');
var router = express.Router();
var pool = require('../pool')
var table = 'be_project'
var upload = require('../multer');

const postToTwitter = (user, content) => {
  const oauth = OAuth({
    consumer: { key: process.env.TWITTER_CONSUMER_KEY, secret: process.env.TWITTER_CONSUMER_SECRET },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto.createHmac('sha1', key).update(base_string).digest('base64');
    }
  });

  const request_data = {
    url: 'https://api.twitter.com/1.1/statuses/update.json',
    method: 'POST',
    data: { status: content.description }
  };

  const token = {
    key: user.access_token,
    secret: user.token_secret
  };

  axios({
    method: request_data.method,
    url: request_data.url,
    data: request_data.data,
    headers: oauth.toHeader(oauth.authorize(request_data, token))
  }).then(response => {
    console.log('Posted to Twitter:', response.data);
  }).catch(error => {
    console.error('Error posting to Twitter:', error);
  });
};

router.post('/post-to-twitter/:contentId', (req, res) => {
  Content.findByPk(req.params.contentId).then(content => {
    User.findByPk(content.user_id).then(user => {
      postToTwitter(user, content);
      res.send('Posted to Twitter!');
    });
  });
});


router.get('/auth/twitter', passport.authenticate('twitter'));

router.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/dashboard');
  });


  router.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth/twitter');
    }
    res.send('<form action="/submit" method="POST" enctype="multipart/form-data"> \
      <input type="file" name="photo" required> \
      <textarea name="description" placeholder="Enter description"></textarea> \
      <button type="submit">Submit</button> \
    </form>');
  });
  