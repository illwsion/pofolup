//파일 관리, 이메일 전송 미들웨어
const nodemailer = require('nodemailer');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

//보안 관련 미들웨어
const sanitize = require('sanitize-html');

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'uploads/')
  },
  filename: (req, file, callback) => {


    callback(null, Date.now() + '-' + file.originalname)
  }
});

exports.upload = multer({
  storage: storage,
  //파일 크기 100mb로 제한
  limits: {
    fileSize: 1024 * 1024 * 100
  }

});


exports.sendMail = (req, res) => {
  //메일 관련
  const files = req.files;
  let filename = req.files[0].filename;

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

  //1.파일 사이즈 알아오기
  let myfile = fs.statSync(path.join(__dirname, '/../uploads/', req.files[0].filename));


  //2.filesize에 따라 mailoptions 설정
  let mailOptions;

  if (myfile.size < 1024 * 1024 * 11) {
    //res.send('Uploaded! : ' + filename);
    console.log("파일 첨부 가능");
    mailOptions = {
      from: process.env.senderID,
      to: process.env.receiverID,
      subject: '채용공고 페이지 그림작가' + sanitize(req.body.position) + ' ' + sanitize(req.body.realname) + ' 지원',
      text: '지원 분야 : 그림작가' /*+ sanitize(req.body.position) */ +
        '\n이름 : ' + sanitize(req.body.realname) +
        '\n이메일 : ' + sanitize(req.body.username) +
        '\n접한 경로 : ' + sanitize(req.body.route) +
        '\n추가 포트폴리오 링크 : ' + sanitize(req.body.url),
      attachments: [{
        filename: filename,
        path: __dirname + '/../uploads/' + filename
      }]
    };
  } else {
    console.log("파일 첨부 불가능");
    mailOptions = {
      from: process.env.senderID,
      to: process.env.receiverID,
      subject: '채용공고 페이지 그림작가' + sanitize(req.body.position) + ' ' + sanitize(req.body.realname) + ' 지원',
      text: '지원 분야 : 그림작가' /*+ sanitize(req.body.position) */ +
        '\n이름 : ' + sanitize(req.body.realname) +
        '\n이메일 : ' + sanitize(req.body.username) +
        '\n접한 경로 : ' + sanitize(req.body.route) +
        '\n추가 포트폴리오 링크 : ' + sanitize(req.body.url) +
        '\n용량 ' + (myfile.size / (1024 * 1024)).toFixed(2) + 'mb의 첨부 파일 ' + filename + ' 를 보냈지만 용량 문제로 전송되지 않음'
    };
  }



  //3.그 후 메일 전송
  /*
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
  */
};