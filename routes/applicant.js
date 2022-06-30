/* 해당 코드는 안진형(cookise09@naver.com)에 의해 작성되었습니다 */

const express = require('express');
const passport = require('passport');
const router = express.Router();
const path = require('path');

const Applicant = require('./../models/applicant');

const cookieParser = require('cookie-parser');
const http = require('http');
const url = require('url');
const csrf = require('csurf');
const csrfProtection = csrf({
  cookie: true
});
//controllers 연결
const applicantController = require('./../controllers/applicantController');
const articleController = require('./../controllers/articleController');
const categoryController = require('./../controllers/categoryController');
const nodemailerController = require('./../controllers/nodemailerController.js')
const noticeController = require('./../controllers/noticeController.js')
const s3Controller = require('./../controllers/s3Controller');


router.use(cookieParser(process.env.cookieKey));

//스태틱 폴더 지정
router.use(express.static(__dirname + '/../public'));


//로그인 여부 확인
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

//이메일 인증 확인
const isVerified = (req, res, next) => {
  if (req.isAuthenticated()) {
    if (req.user.isVerified) {
      return next();
    } else {
      res.render('applicantVerify');
    }
  }
  res.redirect('/');
};

//메인 페이지.
router.get('/', csrfProtection, (req, res) => {
  if (req.isAuthenticated()) {
    //로그인되어있을시 자동으로 이동
    if (req.user.isAdmin){
      res.redirect('/adminPage/illustrator/1');
    }else{
      res.redirect('/applicants/' + req.user.username);
    }
  }else{
    res.render('index', {
      user: req.user,
      csrfToken: req.csrfToken(),
    });
  }
});

//회원가입 페이지
router.get('/register', csrfProtection, (req, res)=>{
  //로그인 안되어있어야 가능
  if (req.isAuthenticated()) {
    res.redirect('/');
  } else {
    res.render('applicantRegister',{
      csrfToken: req.csrfToken()
    });
  }
});

//회원가입 버튼 클릭
router.post('/register', nodemailerController.uploadFile, csrfProtection, applicantController.findApplicant, applicantController.getTotalUser, applicantController.createApplicant, passport.authenticate("local",{
  successRedirect: '/',
  failureRedirect: '/'
}), (req, res) => {
  console.log('hello');
  console.log(req.body._csrf);
});

//로그인
router.post('/userLogin', csrfProtection, passport.authenticate('local', {
  failureRedirect: '/loginFailed',
  session: true
}), applicantController.findApplicant, articleController.findArticle, (req, res) => {
  //로그인 성공하면 유저, 게시글 정보 불러옴
  var applicantsData = req.applicantsData;
  var articlesData = req.articlesData;
  //관리자면 관리자 페이지, 아니면 사용자 상세페이지로 이동
  if (applicantsData[0].isAdmin) {
    res.redirect('/adminPage/illustrator/1');
  } else {
    res.redirect('/applicants/' + req.user.username);
  }
});


//인증 url
router.get('/checkVerify/:verifyKey', (req, res) => {
  applicantController.verifyApplicant(req, res, req.params.verifyKey);
});

//유저 상세 페이지
router.get('/applicants/:username', csrfProtection, isLoggedIn, applicantController.findApplicant, articleController.findArticle, categoryController.getAllCategories,(req, res) => {
  let CategoryData = req.categoriesData.find((category)=>
    category.categoryName == 'illustrator'
  );
  //관리자도 아니고 내 계정도 아니면 튕겨나감
  if (req.user.username != req.params.username && req.user.isAdmin == false) {
    console.log('다른 사람의 페이지입니다');
    res.render('errorPage',{
      errorDetail: '다른 사람의 페이지입니다'
    });
  } else {
    let ArticlesData = req.articlesData;
    //최신 게시글부터 보이게. 지금은 1개이므로 필요없음
    ArticlesData.reverse();
    let ApplicantsData = req.applicantsData;
    //cors 우회
    res.setHeader('Access-Control-Allow-origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (!ApplicantsData.length){
      res.render('errorPage',{
        errorDetail: '존재하지 않는 사용자입니다'
      });
    }else{
      res.render('applicant', {
        Applicants: ApplicantsData,
        Articles: ArticlesData,
        curCategory: CategoryData,
        csrfToken: req.csrfToken(),
      });
    }
  }
});

//status 변경
router.post('/changeStatus', isLoggedIn, (req, res)=>{
  Applicant.updateOne({username: req.body.username}, {$set: {status: req.body.status}}, (error, applicant)=>{
    if (error){
      console.log(error);
    }else{
    }
  })
  res.send('ok');
});

//유저 프로필 업데이트
//저장하기 버튼 클릭
router.post('/apply', isLoggedIn, nodemailerController.uploadFields, csrfProtection, applicantController.findApplicant, articleController.findArticle,(req, res, next) => {
  if (req.isAuthenticated()) {
    if (req.user.username == req.body.username) {
      articleController.deleteArticle(req, res, req.articlesData[0]._id);
      articleController.createArticle(req, res, req.user._id);
      res.redirect('/applicants/' + req.user.username);
    } else {
      res.render('errorPage', {
        errorDetail: '현재 사용자와 다른 사용자입니다!'
      });
    }
  } else {
    res.render('errorPage_loginFailure');
  }
});

//사용자 개인정보 수정하기 페이지
router.get('/updateApplicant/:username', csrfProtection, isLoggedIn, applicantController.findApplicant,  categoryController.getAllCategories, (req, res) => {
  let CategoryData = req.categoriesData.find((category)=>
    category.categoryName == 'illustrator'
  );
  //관리자도 아니고 내 계정도 아니면 튕겨나감
  if (req.user.username != req.params.username && req.user.isAdmin == false) {
    console.log('다른 사람의 페이지입니다');
    res.redirect('/');
  } else {
    let ApplicantsData = req.applicantsData;
    //cors 우회?

    if (!ApplicantsData.length){
      res.render('errorPage',{
        errorDetail: '존재하지 않는 사용자입니다'
      });
    }else{
      res.render('applicantUpdate', {
        Applicants: ApplicantsData,
        curCategory: CategoryData,
        csrfToken: req.csrfToken(),
      });
    }
  }
});
//개인정보 수정하기 버튼 클릭
router.post('/updateApplicant/:username', isLoggedIn, nodemailerController.uploadFile, csrfProtection, applicantController.findApplicant, (req, res)=>{
  applicantController.updateApplicant(req, res);
  res.redirect('/applicants/' + req.user.username);
});



router.get('/errorPage', (req, res)=>{
  res.render('errorPage');
});

router.get('/loginFailed', (req, res) => {
  res.render('errorPage_loginFailure');
});

router.post('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});
router.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});


//그 외 공지사항 페이지
router.get('/notice/:content', csrfProtection, (req, res) => {
  switch (req.params.content) {
    case 'pofolup_contact':
      if (req.isAuthenticated()){
        if (req.user.isAdmin){
          res.redirect('/contactboard/1');
          break;
        }
      }
      res.render('notice_contact',{
        csrfToken: req.csrfToken(),
      });
      break;
    case 'privacy':
      res.render('notice_privacy');
      break;
    case 'termsAndPolicy':
      res.render('notice_termsAndPolicy');
      break;
    default:
      res.render('errorPage',{
        errorDetail: '없는 페이지입니다'
      });
      break;
  }
});
//제휴문의 생성
router.post('/notice/pofolup_contact', csrfProtection, noticeController.getTotalContact, noticeController.createContact, (req, res)=>{
  /*
  이메일 전송 기능
  req.body.content = req.body.content.replaceAll(/(\r\n|\n|\r)/gm, "<br>");
  nodemailerController.sendContactMail(req, res);
  */
  res.redirect('/notice/pofolup_contact');
});

module.exports = router;
