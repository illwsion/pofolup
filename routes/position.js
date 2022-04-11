const express = require('express');
const router = express.Router();
const path = require('path');

//파일 관리, 이메일 전송 미들웨어
const nodemailer = require('nodemailer');
const fs = require('fs');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
});
const upload = multer({
  storage: storage
});

router.use(express.static(__dirname + '/../static')); //스태틱 폴더 지정

//보안 관련 미들웨어
const sanitize = require('sanitize-html');

router.get('/', (req, res, next) => {
  res.sendFile(path.resolve(__dirname + '/../index.html'));
});

router.get('/:pos', (req, res) => {
  switch (req.params.pos) {
    case 'writer':
      res.sendFile(path.resolve(__dirname + '/../static/webpage/writer.html'));
      break;
    case 'illustrator':
      res.sendFile(path.resolve(__dirname + '/../static/webpage/illustrator.html'));
      break;
    case 'pm':
      res.sendFile(path.resolve(__dirname + '/../static/webpage/pm.html'));
      break;
    case 'apply':
      res.sendFile(path.resolve(__dirname + '/../static/webpage/apply.html'));
      break;
    case 'upload':
      res.sendFile()
  }
})

router.post('/upload', upload.single('user_file'), (req, res) => {
  console.log('제출!');

  //let filename = req.file.filename.slice(13);
  let filename = req.file.filename;
  console.log('filename: ' + filename);

  res.send('Uploaded! : ' + filename);


  let transporter = nodemailer.createTransport({
    service: 'Naver',
    host: process.env.senderHOST,
    port: process.env.senderPORT,
    auth: {
      user: process.env.senderID,
      pass: process.env.senderPW
    }
  });

  let mailOptions = {
    from: process.env.senderID,
    to: process.env.receiverID,
    subject: '채용공고 페이지 ' + req.body.user_job + ' 지원',
    text: '지원 분야 : ' + req.body.user_job +
      '\n이름 : ' + sanitize(req.body.user_name) +
      '\n전화번호 : ' + sanitize(req.body.user_phone) +
      '\n이메일 : ' + sanitize(req.body.user_email) +
      '\n접한 경로 : ' + req.body.user_route +
      '\n추가 포트폴리오 링크 : ' + sanitize(req.body.user_url),

    attachments: [{
      filename: filename,
      path: __dirname + '/../uploads/' + req.file.filename
    }]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      console.log("이메일 전송 실패");
    } else {
      console.log('Email sent: ' + info.response);

      try {
        console.log('파일 삭제 시도');
        fs.unlinkSync(__dirname + '/../uploads/' + req.file.filename);
        console.log("삭제됐나?");
      } catch (error) {
        if (err.code == 'ENOENT') {
          console.log("파일 삭제 Error 발생");
        }
      }

    }
  });

});




module.exports = router;
