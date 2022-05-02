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
  if (req.isAuthenticated()){
    return next();
  }
  console.log("user is not logged in!!");
  res.redirect('/');
};
//관리자 여부 확인
const isAdmin = (req, res, next)=>{
  console.log('logged in user@@@@@@@@@@');
  console.log(req.user);
  if (req.login){
    console.log('someone is logged in@@@@@@@');
    if (req.user.isAdmin){
      return next();
    }
  }else{
    console.log("user is not admin or logged in!!");
    res.render('errorPage');
  }

};

router.get('/', csrfProtection, (req, res) => {
  res.render('index',{
    user: req.user,
    csrfToken: req.csrfToken()
  });
});

router.get('/position/:pos', (req, res) => {
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
    var ApplicantsData = req.applicantsData;
    ApplicantsData.reverse();
    res.render('adminPage', {
      Applicants: ApplicantsData,
      pageNum: req.params.pageNum,
    });
});

//유저 상세 페이지
router.get('/applicants/:username',isLoggedIn, applicantController.findApplicant,articleController.findArticle, (req, res)=>{
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
  //로그인 성공하면 유저, 게시글 정보 불러옴
  var applicantsData = req.applicantsData;
  var articlesData = req.articlesData;
  if (applicantsData[0].isAdmin){
    res.render('adminPage', {
      Applicants: applicantsData,
      Articles: articlesData,
      pageNum: req.params.pageNum,
    });
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
router.get("./logout", function(req, res){
    req.logout();
    res.redirect("/");
});

module.exports = router;
