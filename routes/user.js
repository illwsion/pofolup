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


//로그인 여부 확인
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};
//관리자 여부 확인
const isAdmin = (req, res, next) => {
  if (req.login) {
    if (req.user.isAdmin == true) {
      return next();
    }
  }
  console.log("user is not admin or logged in!!");
  res.render('errorPage', {
    errorDetail: '관리자가 아닙니다!'
  });
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


router.get('/', (req, res) => {
  console.log('@@@get /');
  console.log('req.user');
  console.log(req.user);
  res.render('index', {
    user: req.user,
    //csrfToken: req.csrfToken()
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
      //로그인되어있어야 가능
      if (req.isAuthenticated()) {
        if (req.user.isVerified) {
          res.render('apply');
        } else {
          res.render('applicantVerify');
        }
      } else {
        res.redirect('/');
      }
      break;
    case 'register':
      //로그인 안되어있어야 가능
      if (req.isAuthenticated()) {
        res.redirect('/');
      } else {
        res.render('applicantRegister');
      }
      break;
  }
})


router.post('/adminPage/:category/:pageNum', categoryController.getAllTags, (req, res) => {
  console.log('post at adminPage');
  let queryString = "/adminPage/" + req.params.category + "/" + req.params.pageNum + "?";

  //category별로 hashTags 불러와서 queryString에 넣음
  let query = 'req.body.' + req.Category.hashTags[0];
  if (req.body.hashTags != undefined){
    //태그가 있음
    if (typeof(req.body.hashTags) == 'string'){
      //태그가 1개임
      if (req.Category.hashTags.includes(req.body.hashTags)){
        queryString += req.body.hashTags + '&';
      }
    }else{
      //태그가 2개 이상임
      for (let i=0; i<req.body.hashTags.length; i++){
        if (req.Category.hashTags.includes(req.body.hashTags[i])){
          queryString += req.body.hashTags[i] + '&';
        }
      }
    }
  }


  /*
  if (req.body.good_illust == 'true'){
    console.log('good illust checked');
    queryString += 'good_illust&';
  }
  if (req.body.good_pose == 'true'){
    queryString += 'good_pose&';
  }
  if (req.body.good_age == 'true'){
    queryString += 'good_age&';
  }
  */
  console.log('만든 queryString');
  console.log(queryString);

  res.redirect(queryString);
});

//유저 목록 페이지
router.get('/adminPage/:category/:pageNum', applicantController.getAllApplicants, categoryController.getAllCategories,(req, res) => {
  let ApplicantsData = req.applicantsData;
  let CategoryData = req.categoriesData.find((category)=>
    category.categoryName == req.params.category
  );

  const queryObject = url.parse(req.url, true).query;
  let hashTags = Object.keys(queryObject);

  //주어진 queryObject로
  outer : for (var i=0; i<ApplicantsData.length; i++){
    if(!ApplicantsData[i].categories.includes(req.params.category)){
      console.log(ApplicantsData[i].username);
      ApplicantsData.splice(i, 1);
      console.log('applicant cut by category ' + i);
      i--;
      continue;
    }
    for (var j=0; j<hashTags.length; j++){
      //category 검사해서 맞지 않는 applicant는 삭제
      //Tag에 맞지 않는 ApplicantsData는 삭제
      if (!ApplicantsData[i].userTags.includes(hashTags[j])) {
        console.log(ApplicantsData[i].username);
        ApplicantsData.splice(i, 1);
        console.log('applicant cut by hashtag ' + i);
        i--;
        continue outer;
      };
    }
  }

  let pageSize = 4;
  let maxPage = parseInt(ApplicantsData.length / pageSize);
  if (ApplicantsData % pageSize != 0) {
    maxPage++;
  }
  ApplicantsData.reverse();

  if (req.params.pageNum > maxPage)
    req.params.pageNum = maxPage;
  ApplicantsData = ApplicantsData.slice((req.params.pageNum - 1) * pageSize, req.params.pageNum * pageSize);

  let queryString = "?";
  hashTags.forEach((tag, i)=>{
    queryString = queryString + tag + '&';
  });
  console.log(queryString);

  res.render('adminPage', {
    Applicants: ApplicantsData,
    pageNum: req.params.pageNum,
    pageSize: pageSize,
    maxPage: maxPage,
    queryString: queryString,
    category: req.params.category,
    Categories: req.categoriesData,
    curCategory: CategoryData,
  });
});

//유저 상세 페이지
router.get('/applicants/:username', isLoggedIn, applicantController.findApplicant, articleController.findArticle, (req, res) => {
  console.log('@@@get /applicants/:username');
  //관리자도 아니고 내 계정도 아니면 튕겨나감
  if (req.user.username != req.params.username && req.user.isAdmin == false) {
    console.log('다른 사람의 페이지입니다');
    res.redirect('/');
  } else {
    let ArticlesData = req.articlesData;
    ArticlesData.reverse();
    let ApplicantsData = req.applicantsData;
    res.render('applicant', {
      Applicants: ApplicantsData,
      Articles: ArticlesData,
    });
  }
});

router.get('/attachTag/:applicantId/:tag/:adminId', (req, res)=>{
  categoryController.attachTag(req, res);
});
//로그인 기능
//router.post()

router.post('/userLogin', passport.authenticate('local', {
  failureRedirect: '/loginFailed',
  session: true
}), applicantController.findApplicant, articleController.findArticle, (req, res) => {
  console.log('@@@post /userLogin');
  console.log(req.user);
  //로그인 성공하면 유저, 게시글 정보 불러옴
  var applicantsData = req.applicantsData;
  var articlesData = req.articlesData;
  if (applicantsData[0].isAdmin) {
    res.redirect('/adminPage/illustrator/1');
  } else {
    res.redirect('/applicants/' + req.user.username);
  }
});


router.get('/deleteArticle/:articleId', isLoggedIn, (req, res) => {
  articleController.deleteArticle(req, res, req.params.articleId);
  res.redirect('/applicants/' + req.user.username);
});

router.get('/deleteApplicant/:applicantId', isLoggedIn, (req, res) => {
  applicantController.deleteApplicant(req, res, req.params.applicantId);
  if (req.isAuthenticated()) {
    if (req.user.isAdmin) {
      res.redirect('/adMinPage/illustrator/1');
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
});


router.get('/checkVerify/:verifyKey', (req, res) => {
  applicantController.verifyApplicant(req, res, req.params.verifyKey);
});

router.get('/updateApplicant', isLoggedIn, (req, res) => {

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

module.exports = router;
