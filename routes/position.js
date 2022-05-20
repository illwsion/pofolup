const express = require('express');
const passport = require('passport');
const router = express.Router();
const path = require('path');
const Applicant = require('./../models/applicant');



//mongoose
const applicantController = require('./../controllers/applicantController');
const articleController = require('./../controllers/articleController');
const nodemailerController = require('./../controllers/nodemailerController.js')
const categoryController = require('./../controllers/categoryController');


//스태틱 폴더 지정
router.use(express.static(__dirname + '/../public'));



router.get('/', (req, res) => {
  res.render('index', {
    user: req.user
  });
});

router.post('/register', nodemailerController.upload.array('file'), applicantController.findApplicant, applicantController.createApplicant, passport.authenticate("local",{
  successRedirect: '/registerSuccess',
  failureRedirect: '/'
}), (req, res) => {

});

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
]), applicantController.findApplicant, articleController.findArticle,(req, res, next) => {
  if (req.isAuthenticated()) {
    if (req.user.username == req.body.username) {
      articleController.deleteArticle(req, res, req.articlesData[0]._id);

      nodemailerController.sendApplyMail(req, res);

      articleController.createArticle(req, res, req.user._id);
      //res.render('applySuccess');
      //res.redirect('/applicants/' + req.user.username);
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

router.post('/createTag/:categoryName', (req, res)=>{
  categoryController.createTag(req, res, req.params.categoryName);
});

router.get('/deleteTag/:categoryName/:tag', (req, res)=>{
  console.log("deleteTag");
  categoryController.deleteTag(req, res, req.params.categoryName);
});


module.exports = router;
