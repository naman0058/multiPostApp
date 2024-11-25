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

    
    res.redirect('/post-to-twitter1');
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
      // Exchange authorization code for access token
      const tokenResponse = await axios.post(
          tokenEndpoint,
          new URLSearchParams({
              code,
              grant_type: 'authorization_code',
              redirect_uri: redirectUri,
              code_verifier: oauthData.codeVerifier,
          }),
          {
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Authorization': `Basic ${basicAuth}`,
              },
          }
      );

      const accessToken = tokenResponse.data.access_token;

      console.log(tokenResponse.data)

      // Get image data as Base64
      const imageUrl = 'https://w7.pngwing.com/pngs/178/595/png-transparent-user-profile-computer-icons-login-user-avatars-thumbnail.png';
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBase64 = Buffer.from(response.data).toString('base64');

      // Twitter API credentials
      const consumerKey = '2nx7h7ZexUH7oVF7kErfWts9r';
      const consumerSecret = '9cM1ZVt7O1ZH4IrVbGl73eJVSnwALAfJptp4NmfzmSZV17SDxp';
      // const accessToken1 = '1175441814125305856-ohu5Qe4xNKxjwfijMflz9lxtqZ1kk1';
      // const accessTokenSecret = '83zFUPzdssENDcXCHPKN9k1GmMYAniLHs6TfTBWZRpG4i';

       const accessToken1 = '1840412479815655424-fpRO5hRMdjngxZJgGvrrtpM5ZYyYbK';
      const accessTokenSecret = 'pl3Ormfy3RkpcRRKiGmQEkjfIrYn065VsmGbDz3SpVL9N';
      

      // Initialize OAuth
      const oauth = OAuth({
          consumer: { key: consumerKey, secret: consumerSecret },
          signature_method: 'HMAC-SHA1',
          hash_function(baseString, key) {
              return crypto.createHmac('sha1', key).update(baseString).digest('base64');
          },
      });

      // Media upload
      const url = 'https://upload.twitter.com/1.1/media/upload.json';
      const requestData = {
          url: url,
          method: 'POST',
          data: {
              media_data: imageBase64,
              media_category: 'tweet_image',
          },
      };

      const authHeader = oauth.toHeader(
          oauth.authorize(requestData, { key: accessToken1, secret: accessTokenSecret })
      );

      const mediaUploadResponse = await axios.post(
          url,
          new URLSearchParams(requestData.data),
          {
              headers: {
                  ...authHeader,
                  'Content-Type': 'application/x-www-form-urlencoded',
              },
          }
      );


      console.log('mediaUploadResponse',mediaUploadResponse.data)

      const mediaId = mediaUploadResponse.data.media_id_string;

      // Post tweet with media
      const tweetText = 'Hello, This is my first tweet with an imag';
      const tweetResponse = await axios.post(
          'https://api.twitter.com/2/tweets',
          {
              text: tweetText,
              media: {
                  media_ids: [mediaId],
                  // media_category:'tweet_image'
              },
              // additional_owners:''
              
          },
          {
              headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
              },
          }
      );

      res.send(`Tweet posted successfully! ID: ${tweetResponse.data.data.id}`);
  } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      res.status(500).json(error.response?.data || error.message);
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
  router.get('/post-to-twitter1', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send('User not authenticated');
    }
  
    const content = 'Tweet Text'; // The content to post
    const user = req.user; // The authenticated user
     console.log(user)
    // res.json({user:user,message:'fetch'})
    try {
      const response = await postToTwitter(user, content);
      return res.json(response);  // Send the response from Twitter API
    } catch (error) {
      return res.status(301).json({ error: error.message });  // Handle error
    }
  });
  


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



async function createRecordInAirtable(access_token,user_id) {
  console.log('IG Long Token',access_token)
  console.log('Record id',user_id)

  const url = 'https://api.airtable.com/v0/appRpxG6vjd1AyqIs/tblAPmf1cpJffQy8R';
  const bearerToken = 'pat6nJpcTLLrYBZDL.e73adec8b3d5025c80053dd03d7dfd9d31b65e3df1ede273d79cbc94ee89abab';

  const data = {
      records: [
          {
              fields: {
                  Medium: 'Instagram',
                  "IG Long Token": access_token,
                  "Record id": 'rec123456789',
                  "IG User Id": user_id
              },
          },
      ],
  };

  try {
      const response = await axios.post(url, data, {
          headers: {
              Authorization: `Bearer ${bearerToken}`,
              'Content-Type': 'application/json',
          },
      });

      return {
          success: true,
          data: response.data,
      };
  } catch (error) {
      return {
          success: false,
          error: error.response?.data || error.message,
      };
  }
}







const INSTAGRAM_CLIENT_ID = '441162705660684';
const INSTAGRAM_CLIENT_SECRET = '93e025dd145211f8b34581b24b6e27a4';
const REDIRECT_URI = 'https://www.spvaig.com/auth/instagram/callback';





router.get('/auth/instagram/callback', async (req, res) => {
  const code = req.query.code;


  if (!code) {
    return res.status(400).send('Code not found');
  }

  try {
    // Exchange code for short-lived access token
    const payload = new URLSearchParams();
    payload.append('client_id', INSTAGRAM_CLIENT_ID);
    payload.append('client_secret', INSTAGRAM_CLIENT_SECRET);
    payload.append('grant_type', 'authorization_code');
    payload.append('redirect_uri', REDIRECT_URI);
    payload.append('code', code);

    const response = await axios.post('https://api.instagram.com/oauth/access_token', payload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token , user_id } = response.data;
    console.log('Short-lived token response:', response.data);
   
    const longLivedToken = await longlivedtoken(response.data.access_token)
     console.log('Long Lived Token Output',longLivedToken)
    
    // Redirect or respond with a success message
    //  res.redirect(`/instagrampost?access_token=${access_token}&user_id=${user_id}`);
    const result = await createRecordInAirtable(access_token,user_id);
    if (result.success) {
      res.status(201).json({
          message: 'Record created successfully',
          data: result.data,
      });
  } else {
      res.status(500).json({
          message: 'Error creating record',
          error: result.error,
      });
  }

  } catch (error) {
    console.error('Error exchanging code for access token:', error.response ? error.response.data : error);
    res.status(500).send('Failed to exchange code for access token');
  }
});


//  longlivedtoken('IGQWRPT3ozMVhIN25ZAckhQV1lKR3VlSC1wM2Q0T09paWs3S0t3N3JBUkJndmFsalg3aWE3MVVLbFFsYTdUeHBJcHFEbXc0TmFSbm9IWU1RU2syZAUNnbkQ0dTNfNW42NGhLT3ZA3dmZAwUGF0ZAjRuX0M2bElfXy1ZAc1FCeWZAiOTFxajVEdwZDZD')

async function longlivedtoken(shortLivedToken) {
  if (!shortLivedToken) {
    throw new Error('Short-lived token is required');
  }

  try {
    const response = await axios.get('https://graph.instagram.com/access_token', {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: '93e025dd145211f8b34581b24b6e27a4',  // Replace with your actual Instagram client secret
        access_token: shortLivedToken
      }
    });

    const { access_token: longLivedToken, expires_in } = response.data;
    console.log('Long-lived token response:', response.data);

    // Return the long-lived token and expiry information
    return { longLivedToken, expires_in };

  } catch (error) {
    console.error('Error exchanging for long-lived access token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to exchange for long-lived access token');
  }
}


router.get('/auth/instagram/refresh_token', async (req, res) => {
  try {
    const longLivedToken = '<YOUR_STORED_LONG_LIVED_ACCESS_TOKEN>'; // Fetch the stored token from the database

    // Make the GET request to refresh the long-lived token
    const refreshResponse = await axios.get(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${longLivedToken}`
    );

    const { access_token: refreshedToken, expires_in } = refreshResponse.data;
    console.log('Refreshed token response:', refreshResponse.data);

    // Update the stored token and expiration time (not shown here)

    res.send({
      message: 'Token refreshed successfully',
      refreshedToken,
      expires_in,
    });

  } catch (error) {
    console.error('Error refreshing access token:', error.response ? error.response.data : error);
    res.status(500).send('Failed to refresh access token');
  }
});






router.get('/instagrampost', async (req, res) => {
    console.log('Instagram Post Query Data', req.query);
  
    const imageUrl = 'https://e7.pngegg.com/pngimages/178/595/png-clipart-user-profile-computer-icons-login-user-avatars-monochrome-black.png';
    const caption = 'Hi this is test';
    const accessToken = req.query.access_token;
    const userId = req.query.user_id;
  
    // Basic validation of access token and user ID
    if (!accessToken || !userId) {
      return res.status(400).send("Access token or user ID is missing");
    }
  
    try {
      // Step 1: Upload media to create a media container
      const uploadRes = await axios.post(
        `https://graph.instagram.com/v21.0/${userId}/media`,
        {
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken
        }
      );
  
      console.log('Media Conatiner ID:', uploadRes.data);
  
      // res.json(uploadRes.data)


  

      const PublishContainer = await axios.post(
        `https://graph.instagram.com/v21.0/${userId}/media_publish`,
        {
          creation_id: uploadRes.data.id,
          access_token: accessToken
        }
      );
  
      console.log('Publish Conatiner ID:',PublishContainer);

      res.json({msg:'success'})
  
            
  
      // Step 2: Publish media using the media container ID
     
  
    } catch (error) {
      console.error('Error posting to Instagram:', error.response ? error.response.data : error.message);
  
      // Enhanced error handling based on the error code
      if (error.response && error.response.data.error.code === 190) {
        return res.status(401).send("Invalid or expired access token. Please re-authenticate.");
      }
      res.status(500).send("Error posting to Instagram");
    }
  });


  router.get('/facebook',(req,res)=>{
    res.render('facebook')
  })
  


  module.exports = router;