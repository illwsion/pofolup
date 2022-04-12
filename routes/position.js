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
  storage: storage,
  limits: { fileSize: 1024*1024*10}
});

//스태틱 폴더 지정
router.use(express.static(__dirname + '/../public'));

//보안 관련 미들웨어
const sanitize = require('sanitize-html');

router.get('/', (req, res, next) => {
  res.sendFile(path.resolve(__dirname + '/../index.html'));
});

router.get('/:pos', (req, res) => {
  switch (req.params.pos) {
    case 'writer':
      res.sendFile(path.resolve(__dirname + '/../views/writer.html'));
      break;
    case 'illustrator':
      res.sendFile(path.resolve(__dirname + '/../views/illustrator.html'));
      break;
    case 'pm':
      res.sendFile(path.resolve(__dirname + '/../views/pm.html'));
      break;
    case 'apply':
      res.sendFile(path.resolve(__dirname + '/../views/apply.html'));
      break;
    case 'upload':
      res.sendFile()
  }
})


//지원하기 버튼 클릭
router.post('/upload', upload.single('user_file'),  async (req, res) => {
  console.time('upload');
  console.log("1");

  let filename = req.file.filename;

  //res.send('Uploaded! : ' + filename);

  let transporter = nodemailer.createTransport({
    service: 'Naver',
    host: process.env.senderHOST,
    port: process.env.senderPORT,
    auth: {
      user: process.env.senderID,
      pass: process.env.senderPW
    }
  });

  //111111111111111.파일 사이즈 알아오기
  let myfile = fs.statSync(__dirname + '/../uploads/' + req.file.filename);
  console.log("myfile : ");
  console.log(myfile.size);


  //222222222222222.filesize에 따라 mailoptions 설정
  //사용자에게 보내는 페이지 설정
  let mailOptions;
  console.log(myfile.size);
  if ( myfile.size < 11000000){
    res.send('Uploaded! : ' + filename);
    console.log("파일 첨부 가능");
    mailOptions = {
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
        path: __dirname + '/../uploads/' + filename
      }]
    };
  }
  else{
    res.send('파일의 크기가 10mb를 넘습니다!\n파일 빼고 Uploaded! : ' + filename);
    console.log("파일 첨부 불가능");
    mailOptions = {
      from: process.env.senderID,
      to: process.env.receiverID,
      subject: '채용공고 페이지 ' + req.body.user_job + ' 지원',
      text: '지원 분야 : ' + req.body.user_job +
        '\n이름 : ' + sanitize(req.body.user_name) +
        '\n전화번호 : ' + sanitize(req.body.user_phone) +
        '\n이메일 : ' + sanitize(req.body.user_email) +
        '\n접한 경로 : ' + req.body.user_route +
        '\n추가 포트폴리오 링크 : ' + sanitize(req.body.user_url) +
        '\n첨부 파일 ' + filename + ' 를 보냈지만 용량 문제로 전송되지 않음'
    };
  }
  console.log("@@@@@@@@@@@@@@@@@mailOptions: " + mailOptions);
  console.log(mailOptions);

  //3333333333333333. 그 후 메일 전송
  transporter.sendMail(mailOptions, (error, info) => {
    console.log("메일 전송 시도");
    if (error) {
      console.log(error);
      console.log("이메일 전송 실패");
    } else {
      console.log('Email sent: ' + info.response);
      console.log("이메일 전송 성공");

    }

    //4. uploads에 있는 파일은 삭제
    try {
      console.log('파일 삭제 시도');
      fs.unlinkSync(__dirname + '/../uploads/' + filename);
      console.log("삭제됐나?");
    } catch (error) {
      if (err.code == 'ENOENT') {
        console.log("파일 삭제 Error 발생");
      }
    }


  });


  console.timeEnd('upload');
});




module.exports = router;
