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
    //nodemailerController.sendMail(req, res);
    res.render('applicantRegisterSuccess', {
      userEmail: req.body.username
    });
  } else {
    console.log("이미 있는 계정입니다");
    res.redirect('/');
  }
});

//지원하기 버튼 클릭
router.post('/apply', nodemailerController.upload.array('file'), applicantController.findApplicant, async (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.username == req.body.username) {
      articleController.saveArticle(req, res, req.user._id);
      nodemailerController.sendApplyMail(req, res);
      res.render('applySuccess');
    } else {
      res.render('errorPage', {
        errorDetail: '현재 사용자와 다른 사용자입니다!'
      });
    }
  }
  else{
    res.render('loginFailed');
  }
});

module.exports = router;
