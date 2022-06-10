const express = require('express');
const passport = require('passport');
const router = express.Router();
const path = require('path');
const Applicant = require('./../models/applicant');

const http = require('http');
const url = require('url');

const csrf = require('csurf');
const csrfProtection = csrf({
  cookie: true
});

const applicantController = require('./../controllers/applicantController');
const articleController = require('./../controllers/articleController');
const categoryController = require('./../controllers/categoryController');
const nodemailerController = require('./../controllers/nodemailerController.js')
const s3Controller = require('./../controllers/s3Controller');

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
  //이메일 인증 안내 페이지
  //다시 보내는 기능도 있고 해야 함
  res.redirect('/');
};

//메인 페이지.
router.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.isAdmin){
      res.redirect('/adminPage/illustrator/1');
    }else{
      res.redirect('/applicants/' + req.user.username);
    }
  }else{
    res.render('index', {
      user: req.user,
      //csrfToken: req.csrfToken()
    });
  }
});

//회원가입
router.get('/register', (req, res)=>{
  //로그인 안되어있어야 가능
  if (req.isAuthenticated()) {
    res.redirect('/');
  } else {
    res.render('applicantRegister');
  }
});

router.post('/register', nodemailerController.upload.array('file'), applicantController.findApplicant, applicantController.getTotalUser, applicantController.createApplicant, passport.authenticate("local",{
  successRedirect: '/',
  failureRedirect: '/'
}), (req, res) => {

});

router.get('/registerSuccess', (req, res)=>{
  res.render('applicantRegisterSuccess',{
    userEmail: req.user.username
  });
});

//로그인 기능
router.post('/userLogin', passport.authenticate('local', {
  failureRedirect: '/loginFailed',
  session: true
}), applicantController.findApplicant, articleController.findArticle, (req, res) => {
  //로그인 성공하면 유저, 게시글 정보 불러옴
  var applicantsData = req.applicantsData;
  var articlesData = req.articlesData;
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
router.get('/applicants/:username', isLoggedIn, applicantController.findApplicant, articleController.findArticle, categoryController.getAllCategories,(req, res) => {
  let CategoryData = req.categoriesData.find((category)=>
    category.categoryName == 'illustrator'
  );
  //관리자도 아니고 내 계정도 아니면 튕겨나감
  if (req.user.username != req.params.username && req.user.isAdmin == false) {
    console.log('다른 사람의 페이지입니다');
    res.redirect('/');
  } else {
    let ArticlesData = req.articlesData;
    ArticlesData.reverse();
    let ApplicantsData = req.applicantsData;
    //cors 우회
    res.setHeader('Access-Control-Allow-origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.render('applicant', {
      Applicants: ApplicantsData,
      Articles: ArticlesData,
      curCategory: CategoryData,
    });
  }
});

//status 변경
router.post('/changeStatus', (req, res)=>{
  Applicant.updateOne({username: req.body.username}, {$set: {status: req.body.status}}, (error, applicant)=>{
    if (error){
      console.log(error);
    }else{
    }
  })
  res.send('ok');
});

//유저 프로필 업데이트
//지원하기 버튼 클릭
router.post('/apply', nodemailerController.upload.fields([
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
]), applicantController.findApplicant, articleController.findArticle,(req, res, next) => {
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
  }
  else{
    res.render('loginFailed');
  }
  next();
}, (req, res)=>{


});

//유저 개인정보 수정하기
router.get('/updateApplicant/:username', isLoggedIn, applicantController.findApplicant,  categoryController.getAllCategories, (req, res) => {
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

    res.render('applicantUpdate', {
      Applicants: ApplicantsData,
      curCategory: CategoryData,
    });
  }
});

router.post('/updateApplicant/:username', nodemailerController.upload.array('file'), applicantController.findApplicant, (req, res)=>{
  applicantController.updateApplicant(req, res);
  res.redirect('/applicants/' + req.user.username);
});



router.get('/errorPage', (req, res)=>{
  res.render('errorPage');
});

router.get('/loginFailed', (req, res) => {
  res.render('loginFailed');
});

router.post('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});
router.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

//공지사항 페이지
router.get('/notice/:content', (req, res) => {
  switch (req.params.content) {
    case 'contact':
      res.render('notice_contact');
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

router.post('/notice/contact', (req, res)=>{
  //nodemailerController.sendContactMail(req, res);
  res.render('mail_contact',{
    companyname: req.body.companyname,
    enquirename: req.body.enquirename,
    phone: req.body.phone,
    email: req.body.email,
    item: req.body.item,
    content: req.body.content,
  });
});

module.exports = router;
