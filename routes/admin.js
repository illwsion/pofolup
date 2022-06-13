const express = require('express');
const passport = require('passport');
const router = express.Router();
const path = require('path');
const Applicant = require('./../models/applicant');

const http = require('http');
const url = require('url');

//mongoose
const applicantController = require('./../controllers/applicantController');
const articleController = require('./../controllers/articleController');
const categoryController = require('./../controllers/categoryController');
const nodemailerController = require('./../controllers/nodemailerController.js');
const noticeController = require('./../controllers/noticeController');;

//스태틱 폴더 지정
router.use(express.static(__dirname + '/../public'));

let pageSize = 4;
let pageSize_notice = 10;

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

//adminPage 검색 기능
const searchCheck = (req, res, next) => {
  const queryObject = url.parse(req.url, true).query;
  let hashTags = Object.entries(queryObject);
  let ApplicantsData;
  if (hashTags[0] != undefined){
    if (hashTags[0][0] == 'search'){
      //검색했으므로 태그 무시하고 이름으로만 찾음
      if (hashTags[1][1] == "realname"){
        Applicant.find({realname: hashTags[0][1]}, (error, applicants)=>{
          if (error){
            console.log('error at finding applicant at adminPage' + error);
          }else{
            ApplicantsData = applicants;
            req.applicantsData = applicants;
            next();
          }
        });
      } else if (hashTags[1][1] == "applicantNumber"){
        if (hashTags[1][1].length != 6){
          console.log(hashTags[0][1]);
          hashTags[0][1] = ('000000' + hashTags[0][1]).slice(-6);
          console.log(hashTags[0][1]);
        }
        Applicant.find({applicantNumber: hashTags[0][1]}, (error, applicants)=>{
          if (error){
            console.log('error at finding applicant at adminPage' + error);
          }else{
            ApplicantsData = applicants;
            req.applicantsData = applicants;
            next();
          }
        });
      }else{
        next();
      }
    }else{
      next();
    }
  }else{
    next();
  }
};


//관리자 페이지
router.get('/adminPage/:category/:pageNum', applicantController.getAllApplicants, categoryController.getAllCategories, searchCheck, (req, res) => {
  let ApplicantsData = req.applicantsData;
  let CategoryData = req.categoriesData.find((category)=>
    category.categoryName == req.params.category
  );
  const queryObject = url.parse(req.url, true).query;
  let hashTags = Object.entries(queryObject);
  //주어진 queryObject로

  if (hashTags[0] != undefined){
    if (hashTags[0][0] != 'search'){
      //검색한게 없으므로 태그 적용
      outer : for (var i=0; i<ApplicantsData.length; i++){
        if(!ApplicantsData[i].categories.includes(req.params.category)){
          ApplicantsData.splice(i, 1);
          i--;
          continue;
        }
        for (var j=0; j<hashTags.length; j++){
          //category 검사해서 맞지 않는 applicant는 삭제
          //Tag에 맞지 않는 ApplicantsData는 삭제

          if (!ApplicantsData[i].userTags.includes(hashTags[j][0])) {
            ApplicantsData.splice(i, 1);
            i--;
            continue outer;
          };
        }
      }
    }
  }else{

  }

  let maxPage = parseInt(ApplicantsData.length / pageSize);
  if (ApplicantsData.length % pageSize != 0) {
    maxPage++;
  }
  //유저 updateDate 기준으로 정렬
  ApplicantsData.sort((a,b)=>{
    if (a.updateDate < b.updateDate) return 1;
    else return -1;
  });

  if (req.params.pageNum > maxPage)
    req.params.pageNum = maxPage;
  if (req.params.pageNum == 0)
    req.params.pageNum = 1;
  if (maxPage ==0) maxPage++;

  ApplicantsData = ApplicantsData.slice((req.params.pageNum - 1) * pageSize, req.params.pageNum * pageSize);

  let queryString = "?";
  hashTags.forEach((tag, i)=>{
    queryString = queryString + Object.values(tag)[0] + '&';
  });

  res.render('adminPage', {
    curAdmin: req.user,
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

//태그 검색
router.post('/adminPage/:category/:pageNum', categoryController.getAllTags, (req, res) => {
  let queryString = "/adminPage/" + req.params.category + "/" + req.params.pageNum + "?";
  //검색창에 무언가를 검색했을 경우
  if (req.body.targetName.length != 0){
    queryString += ("search="+req.body.targetName + "&");
    queryString += ("searchOption="+req.body.searchOption + "&");
  }

  //category별로 hashTags 불러와서 queryString에 넣음
  let query = 'req.body.' + req.Category.hashTags[0];
  if (req.body.targetName+'1' != '1'){
    //console.log('뭔가 입력됐네 post');
    req.targetName = req.body.targetName;
  }else{
    //console.log('아무것도 입력 안됨post');
  }

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
  res.redirect(queryString);
});


//scrapList 받아오기 기능
const scrapList = (req, res, next) => {
  Applicant.findById(req.user._id)
  .populate('scrapList')
  .exec(function(error, applicant){
    if (error){
      console.log('error at scrapList'+error);
      next();
    }else{
      req.applicantsData = applicant.scrapList;
      next();
    }
  });
};

//관리자 즐겨찾기 페이지

router.get('/scrapList/:category/:pageNum', categoryController.getAllCategories, scrapList, (req, res)=>{
  let ApplicantsData = req.applicantsData;
  ApplicantsData.reverse();
  let CategoryData = req.categoriesData.find((category)=>
    category.categoryName == req.params.category
  );
  const queryObject = url.parse(req.url, true).query;
  let hashTags = Object.entries(queryObject);
  //주어진 queryObject로

  let maxPage = parseInt(ApplicantsData.length / pageSize);
  if (ApplicantsData.length % pageSize != 0) {
    maxPage++;
  }
  ApplicantsData.reverse();

  if (req.params.pageNum > maxPage)
    req.params.pageNum = maxPage;
  if (req.params.pageNum == 0)
    req.params.pageNum = 1;
  if (maxPage ==0) maxPage++;

  ApplicantsData = ApplicantsData.slice((req.params.pageNum - 1) * pageSize, req.params.pageNum * pageSize);

  let queryString = "?";
  hashTags.forEach((tag, i)=>{
    queryString = queryString + tag + '&';
  });

  res.render('adminPage_scrapList', {
    curAdmin: req.user,
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

//즐겨찾기 추가
router.post('/scrapApplicant/:applicantId', (req, res)=>{
  Applicant.findById(req.user._id, (error, applicant)=>{
    if (error){
      console.log('error at scrapApplicant'+error);
    }else{
      if (!applicant.scrapList.includes(req.params.applicantId)){
        applicant.scrapList.push(req.params.applicantId);
        applicant.save();
      }else{
      }
    }
  });

  res.send('ok');
})

//즐겨찾기 삭제
router.post('/unscrapApplicant/:applicantId', (req, res)=>{
  Applicant.updateOne({_id: req.user._id}, {$pull : {scrapList: req.params.applicantId}}, (error, applicant)=>{
    if (error){
      console.log('error at unscrapApplicant'+error);
    }else{
    }
  });
  res.send('ok');
})

//공지사항 게시판

router.get('/noticeboard/create', (req, res)=>{
  res.render('notice_createNotice');
});

router.post('/noticeboard/create', nodemailerController.upload.array('file'), noticeController.getTotalNotice, noticeController.createNotice, (req, res)=>{
  res.redirect('/noticeboard/1');
});

router.get('/noticeboard/views/:noticeNumber', noticeController.findNotice, (req, res)=>{
  res.render('notice_noticeArticle',{
    Notices: req.noticesData,
  });
});
router.get('/noticeboard/deleteNotice/:noticeNumber', (req, res)=>{
  noticeController.deleteNotice(req, res, req.params.noticeNumber);
  res.redirect('/noticeboard/1');
});

router.get('/noticeboard/:pageNum', noticeController.getAllNotices,(req, res)=>{
  let NoticesData = req.noticesData;
  NoticesData.reverse();

  let maxPage = parseInt(NoticesData.length / pageSize_notice);
  if (NoticesData.length % pageSize_notice != 0){
    maxPage++;
  }
  if (req.params.pageNum > maxPage)
    req.params.pageNum = maxPage;
  if (req.params.pageNum == 0)
    req.params.pageNum = 1;
  if (maxPage ==0) maxPage++;

  NoticesData = NoticesData.slice((req.params.pageNum - 1) * pageSize_notice, req.params.pageNum * pageSize_notice);

  res.render('notice_noticeboard',{
    Notices: NoticesData,
    pageNum: req.params.pageNum,
    maxPage: maxPage,
  });
});

//유저 삭제
router.get('/deleteApplicant/:applicantId', isLoggedIn, (req, res) => {
  applicantController.deleteApplicant(req, res, req.params.applicantId);
  if (req.isAuthenticated()) {
    if (req.user.isAdmin) {
      res.redirect('/adminPage/illustrator/1');
    } else {
      res.redirect('/');
    }
  } else {
    res.redirect('/');
  }
});

//게시글 삭제
router.get('/deleteArticle/:articleId', isLoggedIn, (req, res) => {
  articleController.deleteArticle(req, res, req.params.articleId);
  res.redirect('/applicants/' + req.user.username);
});

//태그 부여
router.get('/attachTag/:applicantEmail/:tag/:adminId', (req, res)=>{
  categoryController.attachTag(req, res);
});

//태그 취소
router.post('/detachTag/:applicantEmail/:tag/:adminId', (req, res)=>{
  categoryController.detachTag(req, res);
});

//태그 생성
router.post('/createTag/:categoryName', (req, res)=>{
  categoryController.createTag(req, res, req.params.categoryName);
});

//태그 삭제
router.get('/deleteTag/:categoryName/:tag', (req, res)=>{
  categoryController.deleteTag(req, res, req.params.categoryName);
});

//관리자 임명
router.get('/appointAdmin/:applicantEmail', (req, res)=>{
  applicantController.appointAdmin(req, res);
  res.redirect('/applicants/'+req.params.applicantEmail);
});

module.exports = router;
