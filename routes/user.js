const express = require('express');
const passport = require('passport');
const router = express.Router();
const path = require('path');
const Applicant = require('./../models/applicant');

const csrf = require('csurf');
const csrfProtection = csrf({cookie: true});

const applicantController = require('./../controllers/applicantController');
const articleController = require('./../controllers/articleController');


//로그인 여부 확인
const isLoggedIn = (req, res, next)=>{
  console.log("@@@check isLoggedIn");
  if (req.isAuthenticated()){
    return next();
  }
  console.log("user is not logged in!!");
  res.redirect('/');
};
//관리자 여부 확인
const isAdmin = (req, res, next)=>{
  if (req.login){
    if (req.user.isAdmin == true){
      return next();
    }
  }
  console.log("user is not admin or logged in!!");
  res.render('errorPage');

};

router.get('/', csrfProtection, (req, res) => {
  console.log('@@@get /');
  console.log('req.user');
  console.log(req.user);
  res.render('index',{
    user: req.user,
    csrfToken: req.csrfToken()
  });
});

router.get('/position/:pos', (req, res) => {
  console.log('@@@get /position/:pos');
  switch (req.params.pos) {
    case 'writer':
      res.sendFile(path.resolve(path.join(__dirname, '/../views/writer.html')));
      break;
    case 'illustrator':
      res.sendFile(path.resolve(path.join(__dirname, '/../views/illustrator.html')));
      break;
    case 'pm':
      res.sendFile(path.resolve(path.join(__dirname, '/../views/pm.html')));
      break;
    case 'apply':
      res.render('apply');
      //res.sendFile(path.resolve(path.join(__dirname, '/../views/apply.html')));
      break;
  }
})

//유저 목록 페이지
router.get('/adminPage/:pageNum', isAdmin, applicantController.getAllApplicants, (req, res) => {
  console.log('@@@get /adminPage/:pageNum');
  var ApplicantsData = req.applicantsData;
  ApplicantsData.reverse();
  res.render('adminPage', {
    Applicants: ApplicantsData,
    pageNum: req.params.pageNum,
  });
});

//유저 상세 페이지
router.get('/applicants/:username',isLoggedIn, applicantController.findApplicant,articleController.findArticle, (req, res)=>{
  console.log('@@@get /applicants/:username');
  //관리자도 아니고 내 계정도 아니면 튕겨나감
  if (req.user.username != req.params.username && req.user.isAdmin == false){
    console.log('다른 사람의 페이지입니다');
    res.redirect('/');
  }
  else{
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

router.post('/userLogin', csrfProtection, passport.authenticate('local',{
  failureRedirect: '/loginFailed',
  session: true
}),applicantController.findApplicant, articleController.findArticle, (req, res)=>{
  console.log('@@@post /userLogin');
  console.log(req.user);
  //로그인 성공하면 유저, 게시글 정보 불러옴
  var applicantsData = req.applicantsData;
  var articlesData = req.articlesData;
  if (applicantsData[0].isAdmin){
    res.redirect('/adminPage/1');
  }
  else{
    res.redirect('/applicants/'+req.user.username);
  }
});

router.get('/deleteApplicant/:applicantId', (req, res)=>{
  res.redirect('/');

});

router.get('/deleteArticle/:articleId', isLoggedIn, (req, res)=>{
  articleController.deleteArticle(req, res, req.params.articleId);
  res.redirect('/applicants/'+req.user.username);
});

router.get('/loginFailed', (req, res)=>{
  res.render('loginFailed');
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
