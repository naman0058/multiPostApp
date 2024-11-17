// Use dynamic import for got
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');
const qs = require('querystring');
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const port = 3000;

// Load got dynamically
async function loadGot() {
  return (await import('got')).default;
}

// Twitter API keys from environment variables
const consumer_key = process.env.TWITTER_CONSUMER_KEY;
const consumer_secret = process.env.TWITTER_CONSUMER_SECRET;

const oauth = OAuth({
  consumer: {
    key: consumer_key,
    secret: consumer_secret
  },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
});

const requestTokenURL = 'https://api.twitter.com/oauth/request_token?oauth_callback=oob&x_auth_access_type=write';
const authorizeURL = new URL('https://api.twitter.com/oauth/authorize');
const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
const endpointURL = `https://api.twitter.com/2/tweets`;

// Helper function to request an OAuth token
async function requestToken() {
  const got = await loadGot();  // Dynamically load got
  const authHeader = oauth.toHeader(oauth.authorize({
    url: requestTokenURL,
    method: 'POST'
  }));

  const req = await got.post(requestTokenURL, {
    headers: {
      Authorization: authHeader["Authorization"]
    }
  });
  if (req.body) {
    return qs.parse(req.body);
  } else {
    throw new Error('Cannot get an OAuth request token');
  }
}

// Other functions like accessToken, makeTweetRequest will use `got` in the same way

app.get('/', async (req, res) => {
  try {
    const oAuthRequestToken = await requestToken();



    authorizeURL.searchParams.append('oauth_token', oAuthRequestToken.oauth_token);
    res.send(`<p>Please <a href="${authorizeURL.href}" target="_blank">authorize the app here</a> and then enter the PIN below:</p>
              <form method="POST" action="/tweet">
                <input type="hidden" name="oauth_token" value="${oAuthRequestToken.oauth_token}">
                <input type="hidden" name="oauth_token_secret" value="${oAuthRequestToken.oauth_token_secret}">
                <label for="pin">PIN:</label>
                <input type="text" id="pin" name="pin">
                <button type="submit">Tweet</button>
              </form>`);
  } catch (error) {
    res.json(error)
  }
});

app.post('/tweet', express.urlencoded({ extended: true }), async (req, res) => {
  const { oauth_token, oauth_token_secret, pin } = req.body;

  try {
    const oAuthAccessToken = await accessToken({ oauth_token, oauth_token_secret }, pin.trim());
    const tweetData = {
      text: 'Hello worldss'
    };
    const tweetResponse = await makeTweetRequest(oAuthAccessToken, tweetData);
    res.send(`Tweet successfully posted! <br> Response: ${JSON.stringify(tweetResponse)}`);
  } catch (error) {
    res.json(error)
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
