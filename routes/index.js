const axios = require('axios');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
var express = require('express');
var router = express.Router();
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
var upload = require('./multer');


// const postToTwitter = (user, content) => {
//   const oauth = OAuth({
//     consumer: { key: process.env.TWITTER_CONSUMER_KEY, secret: process.env.TWITTER_CONSUMER_SECRET },
//     signature_method: 'HMAC-SHA1',
//     hash_function(base_string, key) {
//       return crypto.createHmac('sha1', key).update(base_string).digest('base64');
//     }
//   });

//   const request_data = {
//     url: 'https://api.twitter.com/1.1/statuses/update.json',
//     method: 'POST',
//     data: { status: content.description }
//   };

//   const token = {
//     key: user.access_token,
//     secret: user.token_secret
//   };

//   axios({
//     method: request_data.method,
//     url: request_data.url,
//     data: request_data.data,
//     headers: oauth.toHeader(oauth.authorize(request_data, token))
//   }).then(response => {
//     console.log('Posted to Twitter:', response.data);
//   }).catch(error => {
//     console.error('Error posting to Twitter:', error);
//   });
// };

// router.post('/post-to-twitter/:contentId', (req, res) => {
//   Content.findByPk(req.params.contentId).then(content => {
//     User.findByPk(content.user_id).then(user => {
//       postToTwitter(user, content);
//       res.send('Posted to Twitter!');
//     });
//   });
// });


router.get('/auth/twitter', passport.authenticate('twitter'));

router.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication
    // res.json({
    //   user: req.user,
    //   message: 'Successfully authenticated with Twitter!'
    // });

    
    res.redirect('/post-to-twitter');
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
  




  const base64url = require('base64url');
  
  // Helper function to generate a code verifier and code challenge
  function generateCodeChallenge() {
    const codeVerifier = base64url(crypto.randomBytes(32));
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    const codeChallenge = base64url(hash);
    return { codeVerifier, codeChallenge };
}
  
  // Store the code verifier and challenge in a temporary in-memory storage (or session)
  const oauthData = {
    codeVerifier: null,
    state: null
};
  
router.get('/post-to-twitter', async (req, res) => {
    const { codeVerifier, codeChallenge } = generateCodeChallenge();
    oauthData.codeVerifier = codeVerifier;
    oauthData.state = 'randomState123';

    const clientId = 'WkVjRjBfRmpwQlBaV0dKNktGVGo6MTpjaQ';
    const redirectUri = 'http://localhost:3000/callback';
    const scopes = 'tweet.read tweet.write follows.read users.read';

    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scopes)}&state=${oauthData.state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    res.redirect(authUrl);
});

// Step 2: Handle Twitter callback
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;



    if (state !== oauthData.state) {
        return res.status(400).send('State mismatch');
    }

    const clientId = 'WkVjRjBfRmpwQlBaV0dKNktGVGo6MTpjaQ';
    const clientSecret = 'm4_DGhbGIp7UwYJExyMh0PLQfIcJ1uom2x_2B-anYN-lcQxhg9';
    const redirectUri = 'http://localhost:3000/callback';
    const tokenEndpoint = 'https://api.twitter.com/2/oauth2/token';
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const response = await axios.post(tokenEndpoint, new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
            code_verifier: oauthData.codeVerifier
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`
            }
        });

        const accessToken = response.data.access_token;
    console.log('USers Data',response.data)

        console.log('accessToken', accessToken);

        // Upload image to Twitter to get media_id
        const imageUrl = 'https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png';
        const base64image = Buffer.from(imageUrl).toString('base64');
        // const mediaUploadResponse = await axios.post(
        //     'https://upload.twitter.com/1.1/media/upload.json',
        //     new URLSearchParams({
        //         media: base64image
        //     }),
        //     {
        //         headers: {
        //             Authorization: `Bearer ${accessToken}`,
        //             'Content-Type': 'application/x-www-form-urlencoded'
        //         }
        //     }
        // );

        // const mediaId = mediaUploadResponse;
        // console.log('mediaId', mediaId);

        // Now post the tweet with the image
        const tweetText = 'Hello, world! This is my first tweet with image!';
        const tweetResponse = await axios.post(
            'https://api.twitter.com/2/tweets',
            {
                text: tweetText,
              
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.send(`Tweet posted successfully! ID: ${tweetResponse.data.data.id}`);
    } catch (error) {
        console.error('Error:',error);
        res.status(500).send('Error posting tweet with image');
    }
});



async function uploadMediaToTwitter(imagePath, accessToken) {
    try {
        // Read the image file as binary
        const form = new FormData();
        form.append('media', fs.createReadStream(imagePath));

        const mediaUploadResponse = await axios.post(
            'https://upload.twitter.com/1.1/media/upload.json',
            form,   
            {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        console.log('Media Upload Response:', mediaUploadResponse.data);
        const mediaId = mediaUploadResponse.data.media_id_string;
        return mediaId;
    } catch (error) {
        console.error('Error uploading media:', error);
        throw error;
    }
}
  


  // Route to handle posting content to Twitter
//   router.get('/post-to-twitter', async (req, res) => {
//     if (!req.isAuthenticated()) {
//       return res.status(401).send('User not authenticated');
//     }
  
//     const content = 'Tweet Text'; // The content to post
//     const user = req.user; // The authenticated user
//      console.log(user)
//     // res.json({user:user,message:'fetch'})
//     try {
//       const response = await postToTwitter(user, content);
//       return res.json(response);  // Send the response from Twitter API
//     } catch (error) {
//       return res.status(301).json({ error: error.message });  // Handle error
//     }
//   });
  


  const postToTwitter = async (user, content) => {
    const data = JSON.stringify({ text: content });




    // Initialize OAuth
    const oauth = OAuth({
        consumer: {
            key: 'veirnEqPRrO66imvgfLNaX9V8',
            secret: 'wfXYyRdBQOHOtompl2vxshhCoMZfwfltA4xuc46nTqPFYfHcjs'
        },
        signature_method: 'HMAC-SHA1',
        hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
    });

    const request_data = {
        url: 'https://api.twitter.com/2/tweets',
        method: 'POST',
        data: { text: content }
    };

    const token = {
        key: '1840412479815655424-hLjlS1LxsP5MctOkPiFaWhkma2OAeG',
        secret: 'ogy0Xn8Vat0NonMZeybuzFNHpbGVaO1AHzx7z4sWnqS0x'
    };


    try {
        // Sign the request with OAuth headers
         const oauthHeaders = oauth.toHeader(oauth.authorize(request_data, token));

console.log(oauthHeaders)

         

        // Make the request to Twitter API
        const response = await axios({
            method: 'POST',
            url: 'https://api.twitter.com/2/tweets',
            data: data,
            headers: {
                // ...oauthHeaders,
                'Authorization' : 'OAuth oauth_consumer_key="veirnEqPRrO66imvgfLNaX9V8",oauth_token="1840412479815655424-hLjlS1LxsP5MctOkPiFaWhkma2OAeG",oauth_signature_method="HMAC-SHA1",oauth_timestamp="1729624608",oauth_nonce="HNavkUvo2WM",oauth_version="1.0",oauth_signature="itpZ2PswDvEbZotkQU2u6xUzP8M%3D"',
                'Content-Type': 'application/json'
            }
        });

        console.log('Posted to Twitter:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error posting to Twitter:', error.response?.status, error.response?.data);
        throw error;
    }
};
  
  

  
  
  router.get('/auth/linkedin', passport.authenticate('linkedin', {
    state: true,
  }));

router.get('/auth/linkedin/callback',
    passport.authenticate('linkedin', { failureRedirect: '/' }),
    function (req, res) {
        res.redirect('/upload'); // Redirect to content upload page
    });

router.get('/upload', (req, res) => {
    res.send(`
        <form action="/post-to-linkedin" method="post">
            <textarea name="content" placeholder="Write something..."></textarea>
            <button type="submit">Post to LinkedIn</button>
        </form>
    `);
});

// Post content to LinkedIn
router.post('/post-to-linkedin', (req, res) => {
    const content = req.body.content;
    const userId = req.user.linkedinId;

    // Fetch user's accessToken from the database
    db.query('SELECT accessToken FROM users WHERE linkedinId = ?', [userId], (err, rows) => {
        if (err) throw err;
        const accessToken = rows[0].accessToken;

        // Post content to LinkedIn
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'x-li-format': 'json'
        };

        const postBody = {
            author: `urn:li:person:${userId}`,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: content
                    },
                    shareMediaCategory: 'NONE'
                }
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
        };

        axios.post('https://api.linkedin.com/v2/ugcPosts', postBody, { headers })
            .then(response => {
                res.send('Content posted on LinkedIn successfully!');
            })
            .catch(error => {
                console.error(error);
                res.send('Failed to post on LinkedIn.');
            });
    });
});



// For Instagram




// router.post('/post', async (req, res) => {
//     const imageUrl = req.body.imageUrl;  // The image URL to post
//     const caption = req.body.caption;    // The caption of the post
//     const accessToken = req.user.access_token;
  
//     try {
//       // Step 1: Upload media
//       const uploadRes = await axios.post(
//         `https://graph.instagram.com/v12.0/${req.user.instagram_id}/media`,
//         {
//           image_url: imageUrl,
//           caption: caption,
//           access_token: accessToken
//         }
//       );
  
//       const mediaId = uploadRes.data.id;
  
//       // Step 2: Publish media
//       await axios.post(
//         `https://graph.instagram.com/v12.0/${req.user.instagram_id}/media_publish`,
//         {
//           creation_id: mediaId,
//           access_token: accessToken
//         }
//       );
  
//       res.send("Posted successfully!");
  
//     } catch (error) {
//       console.error(error);
//       res.status(500).send("Error posting to Instagram");
//     }
//   });














  
// For Instagram


// Instagram login route
router.get('/auth/instagram', passport.authenticate('instagram'));

// Instagram callback route

router.get('/auth/instagram/callback', async (req, res) => {
  const code = req.query.code;  // Get the code from the callback request

  if (!code) {
    return res.status(400).send('Code not found');
  }

  try {
    // Prepare the payload for the token exchange
    const payload = {
      client_id: '935002488442063',
      client_secret: 'ea1b89b41131753ed9c603acdd2f9f79',
      grant_type: 'authorization_code',
      redirect_uri: 'https://www.spvaig.com/auth/instagram/callback',  // This should match the one used in Step 1
      code: code
    };

    // Send the POST request to exchange the code for the access token
    const response = await axios.post('https://api.instagram.com/oauth/access_token', null, {
      params: payload
    });

    const { access_token, user_id } = response.data;  // Extract access token and user ID
    console.log('code exchange response', response.data);

    // Redirect to /instagrampost route, passing the access token as a query parameter
    res.redirect(`/instagrampost?access_token=${access_token}&user_id=${user_id}`);

  } catch (error) {
    console.error('Error exchanging code for access token:', error.response ? error.response.data : error);
    res.status(500).send('Failed to exchange code for access token');
  }
});


router.get('/auth/instagram/callback', async (req, res) => {
  const code = req.query.code;  // Get the code from the callback request

  if (!code) {
    return res.status(400).send('Code not found');
  }

  try {
    // Prepare the payload for the token exchange
    const payload = new URLSearchParams();
    payload.append('client_id', '935002488442063');
    payload.append('client_secret', 'ea1b89b41131753ed9c603acdd2f9f79');
    payload.append('grant_type', 'authorization_code');
    payload.append('redirect_uri', 'https://www.spvaig.com/auth/instagram/callback');  // Match the redirect URI used in Step 1
    payload.append('code', code);

    // Send the POST request to exchange the code for the access token
    const response = await axios.post('https://api.instagram.com/oauth/access_token', payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, user_id } = response.data;  // Extract access token and user ID
    console.log('code exchange response', response.data);

    // Redirect to /instagrampost route, passing the access token and user ID as query parameters
    res.redirect(`/instagrampost?access_token=${access_token}&user_id=${user_id}`);

  } catch (error) {
    console.error('Error exchanging code for access token:', error.response ? error.response.data : error);
    res.status(500).send('Failed to exchange code for access token');
  }
});


  module.exports = router;