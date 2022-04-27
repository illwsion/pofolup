const express = require('express');
const passport = require('passport');
const router = express.Router();
const path = require('path');
const Applicant = require('./../models/applicant');

//보안 관련 미들웨어
const sanitize = require('sanitize-html');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const dotenv = require('dotenv');

//mongoose
const applicantController = require('./../controllers/applicantController');
const articleController = require('./../controllers/articleController');
dotenv.config({
  path: path.resolve(__dirname, "./.env")
});

router.use(express.static(__dirname + '/../public')); //스태틱 폴더 지정
// req.body
router.use(express.json());
router.use(express.urlencoded({
  extended: true
}));
router.use(cookieParser('cookieKey'));
router.use(session({
  secret: process.env.cookieKey,
  resave: false,
  secure: false,
  saveUninitialized: true,
  cookie:{
    httpOnly: true
  }
}));

router.use(passport.initialize());
router.use(passport.session());



router.get('/', (req, res) => {
  console.log("req.user at index");
  console.log(req.user);
  res.render('index'), {
    user: req.user
  };
});


//유저 목록 페이지
router.get('/adminPage/:pageNum', applicantController.getAllApplicants, (req, res) => {

  if (!req.user){
    console.log('아무도 로그인 안돼있음');
    res.redirect('/');
  }else{
    console.log('현재 로그인된 유저:');
    console.log(req.user);
    var ApplicantsData = req.applicantsData;
    ApplicantsData.reverse();
    res.render('adminPage', {
      Applicants: ApplicantsData,
      pageNum: req.params.pageNum,
    });
  }
});

//유저 상세 페이지
router.get('/applicants/:username',applicantController.findApplicant,articleController.findArticle, (req, res)=>{

  if (!req.user){
    console.log('아무도 로그인 안돼있음');
    res.redirect('/');
  }else{
    console.log('현재 로그인된 유저:');
    console.log(req.user);
    if (req.user.isAdmin){
      console.log('유저는 관리자');
    }else{
      console.log('그냥 일반 유저');
    }

    let ArticlesData = req.articlesData;
    ArticlesData.reverse();
    let ApplicantsData = req.applicantsData;
    res.render('applicant', {
      Applicants: ApplicantsData,
      Articles: ArticlesData,
    });
  }



});

//로그인 기능
//router.post()

router.post('/userLogin', passport.authenticate('local',{
  failureRedirect: '/',
  session: true
}),applicantController.findApplicant, articleController.findArticle, (req, res)=>{
  var applicantsData = req.applicantsData;
  var articlesData = req.articlesData;
  if (applicantsData[0].isAdmin){
    res.render('adminPage', {
      Applicants: applicantsData,
      //Articles: articlesData,
      pageNum: req.params.pageNum,
    });
  }
  else{
    res.render('applicant', {
      Applicants: applicantsData,
      Articles: articlesData,
      pageNum: req.params.pageNum,
    });
  }

});

router.post('/logout', (req, res)=>{
  req.logout();
  res.redirect('/');
});
router.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

module.exports = router;
