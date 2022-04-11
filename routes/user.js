const express = require('express');
const router = express.Router();
const path = require('path');



//보안 관련 미들웨어
const sanitize = require('sanitize-html');

router.get('/', (req, res, next) => {
  res.sendFile(path.resolve(__dirname + '/../index.html'));
});




module.exports = router;
