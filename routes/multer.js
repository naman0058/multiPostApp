var express = require('express');
var router = express.Router();
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.post('/submit', upload.single('photo'), (req, res) => {
  // Save photo path and description to database
  const newContent = {
    user_id: req.user.id,
    photo_path: req.file.path,
    description: req.body.description
  };
  Content.create(newContent).then(() => res.send('Content submitted successfully'));
});
