/* 해당 코드는 안진형(cookise09@naver.com)에 의해 작성되었습니다 */

//파일 관리, 이메일 전송 미들웨어
const nodemailer = require('nodemailer');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const ejs = require('ejs');
//보안 관련 미들웨어
const sanitize = require('sanitize-html');

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'uploads/')
  },
  filename: (req, file, callback) => {
    if (req.isAuthenticated()) {
      if (req.user.isAdmin){
        //공지사항
        callback(null, req.body.title + '-' + Date.now() + '-' + file.originalname);
      }else{
        //포트폴리오 업데이트
        callback(null, req.body.username + '-' + Date.now() + '-' + file.originalname);
      }
    }else{
      //회원가입 시
      callback(null, req.body.username + '-' + Date.now() + '-' + file.originalname);
    }

  }
});

exports.uploadFile = (req, res, next)=>{
  const upload = multer({
    storage: storage,
    //파일 크기 5mb로 제한
    limits: {
      fileSize: 1024 * 1024 * 5
    }
  }).array('file');
  upload(req, res, (error)=>{
    if (error){
      console.log('multer error');
      console.log(error);
      res.render('errorPage', {
        errorDetail: '파일 사이즈는 5mb를 초과하지 않아야 합니다'
      });
    }
    else{
      next();
    }
  })
};

exports.uploadFields = (req, res, next)=>{
  const upload = multer({
    storage: storage,
    //파일 크기 5mb로 제한
    limits: {
      fileSize: 1024 * 1024 * 5
    }
  }).fields([
    {
      name: '0', maxCount: 1
    },
    {
      name: '1', maxCount: 1
    },
    {
      name: '2', maxCount: 1
    },
    {
      name: '3', maxCount: 1
    },
    {
      name: '4', maxCount: 1
    },
    {
      name: '5', maxCount: 1
    },
  ]);
  upload(req, res, (error)=>{
    if (error){
      console.log('multer error');
      console.log(error);
      res.render('errorPage', {
        errorDetail: '파일 사이즈는 5mb를 초과하지 않아야 합니다'
      });
    }
    else{
      next();
    }
  })
};

exports.upload = multer({
  storage: storage,
  //파일 크기 30mb로 제한
  limits: {
    fileSize: 1024 * 1024 * 30
  }
});


exports.sendApplyMail = (req, res, applicant) => {
  let emailTemplate;
  ejs.renderFile('views/mail_applyAlarm.ejs', {
    username: applicant.username,
    realname: applicant.realname,
  }, (error, data)=>{
    if (error){
      console.log('ejs.renderFile err');
    }
    else{
      emailTemplate = data;
    }
  });

  //1. 메일 설정
  let transporter = nodemailer.createTransport({
    service: 'Naver',
    host: process.env.senderHOST,
    port: process.env.senderPORT,
    auth: {
      user: process.env.senderID,
      pass: process.env.senderPW
    }
  });

  //2.메일 내용 설정
  let mailOptions = {
    from: process.env.senderID,
    to: process.env.receiverID,
    subject: '[포폴업] 최종제출 회원',
    html : emailTemplate,
  };


  //3.이메일 전송
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      console.log("이메일 전송 실패");
    } else {
    }
  });

};

exports.sendVerificationMail = (req, res, username, realname, verifyKey)=>{
  let emailTemplate;
  ejs.renderFile('views/mail_verification.ejs', {
    realname: realname,
    verifyKey: verifyKey
  }, (error, data)=>{
    if (error){
      console.log('ejs.renderFile err');
    }
    else{
      emailTemplate = data;
    }
  });

  //1. 메일 설정
  let transporter = nodemailer.createTransport({
    service: 'Naver',
    host: process.env.senderHOST,
    port: process.env.senderPORT,
    auth: {
      user: process.env.senderID,
      pass: process.env.senderPW
    }
  });

  //2.메일 내용 설정
  let mailOptions = {
    from: process.env.senderID,
    to: username,
    subject: '[포폴업] 회원가입 인증메일',
    html : emailTemplate,
  };


  //3.이메일 전송
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      console.log("이메일 전송 실패");
    } else {
    }
  });
};

exports.sendContactMail = (req, res)=>{
  let emailTemplate;
  ejs.renderFile('views/mail_contact.ejs',{
    companyname: req.body.companyname,
    enquirename: req.body.enquirename,
    phone: req.body.phone,
    email: req.body.email,
    item: req.body.item,
    content: req.body.content,
  }, (error,data)=>{
    if (error){
      console.log('ejs.renderFile err');
    }
    else{
      data = data.replaceAll("&lt;br&gt;", "<br>");
      emailTemplate = data;
    }
  });

  //1. 메일 설정
  let transporter = nodemailer.createTransport({
    service: 'Naver',
    host: process.env.senderHOST,
    port: process.env.senderPORT,
    auth: {
      user: process.env.senderID,
      pass: process.env.senderPW
    }
  });

  //2.메일 내용 설정
  let mailOptions = {
    from: process.env.senderID,
    to: process.env.receiverID,
    subject: '[포폴업] 제휴 문의메일',
    html : emailTemplate,
  };


  //3.이메일 전송

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      console.log("이메일 전송 실패");
    } else {
    }
  });


};
