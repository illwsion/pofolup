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
  res.render('index',{
    user: req.user
  });
});



//지원하기 버튼 클릭
router.post('/upload', nodemailerController.upload.array('file'), applicantController.findApplicant,  async (req, res) => {

  //이미 로그인이 되어있다면?
  if (req.isAuthenticated()){
    if (req.user.username == sanitize(req.body.username)){
      //게시물 생성
      articleController.saveArticle(req, res, req.user._id);
      nodemailerController.sendMail(req, res);
      res.render('applied');
    }
    else{
      res.render('errorPage');
    }
  }
  //로그인이 안되어있음
  else{
    //applicant 있는지 확인
    if (req.applicantsData.length == 0){
      console.log("그런 이메일은 없음");
      //새로운 계정 생성
      applicantController.createApplicant(req, res);
      nodemailerController.sendMail(req, res);
      res.render('applied');
    }
    else{
      //로그인이 안되어있지만 계정이 존재할 경우
      //로그인이 되는지 확인
      passport.authenticate("local", {
        //비밀번호 틀리면 loginFailed 창으로
        failureRedirect: '/loginFailed'
      })(req, res, (error, applicant)=>{
        //로그인에 성공하면 위와 똑같음
        articleController.saveArticle(req, res, req.user._id);
        nodemailerController.sendMail(req, res);
        res.render('applied');
      });
    }
  }
});

module.exports = router;
