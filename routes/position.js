const express = require('express');
const passport = require('passport');
const router = express.Router();
const path = require('path');
const Applicant = require('./../models/applicant');



//mongoose
const applicantController = require('./../controllers/applicantController');
const articleController = require('./../controllers/articleController');
const nodemailerController = require('./../controllers/nodemailerController.js')


//스태틱 폴더 지정
router.use(express.static(__dirname + '/../public'));



router.get('/', (req, res) => {
  res.render('index', {
    user: req.user
  });
});

router.post('/register', nodemailerController.upload.array('file'), applicantController.findApplicant, async (req, res) => {
  //applicant 있는지 확인
  if (req.applicantsData.length == 0) {
    console.log("등록되지 않은 지원자");
    //새로운 계정 생성
    applicantController.createApplicant(req, res);
    nodemailerController.sendMail(req, res);
    res.render('applied');
  } else {
    console.log("이미 있는 계정입니다");
    res.redirect('/');
    /*
    //로그인이 안되어있지만 계정이 존재할 경우
    //로그인이 되는지 확인
    passport.authenticate("local", {
      //이미 존재하는 아이디
      //비밀번호 틀리면 loginFailed 창으로
      failureRedirect: '/loginFailed'
    })(req, res, (error, applicant) => {
      //로그인에 성공하면 위와 똑같음
      articleController.saveArticle(req, res, req.user._id);
      nodemailerController.sendMail(req, res);
      res.render('applied');
    });
    */
  }
});

//지원하기 버튼 클릭
router.post('/apply', nodemailerController.upload.array('file'), applicantController.findApplicant, async (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.username == req.body.username) {
      articleController.saveArticle(req, res, req.user._id);
      nodemailerController.sendMail(req, res);
      res.render('applied');
    } else {
      res.render('errorPage');
    }
  }
  else{
    res.render('loginFailed');
  }
});

module.exports = router;
