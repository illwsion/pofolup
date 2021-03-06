/* 해당 코드는 안진형(cookise09@naver.com)에 의해 작성되었습니다 */

//기본 미들웨어
const express = require('express');
const passport = require('passport');
const router = express.Router();
const path = require('path');

//DB 연결
const Applicant = require('./../models/applicant');

//보안을 위한 미들웨어
const http = require('http');
const url = require('url');
const csrf = require('csurf');
const csrfProtection = csrf({
  cookie: true
});
//Controller와 연결
const applicantController = require('./../controllers/applicantController');
const articleController = require('./../controllers/articleController');
const categoryController = require('./../controllers/categoryController');
const nodemailerController = require('./../controllers/nodemailerController.js');
const noticeController = require('./../controllers/noticeController');;

//스태틱 폴더 지정
router.use(express.static(__dirname + '/../public'));
//pageSize : 한 페이지당 보일 지원자 수
//pageSize_notice: 한 페이지당 보일 공지사항 수
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
  if (req.isAuthenticated()) {
    if (req.user.isAdmin == true) {
      return next();
    }
  }
  res.render('errorPage', {
    errorDetail: '관리자가 아닙니다!'
  });
};

//관리자페이지에서 검색창 썼는지 확인
const searchCheck = (req, res, next) => {
  const queryObject = url.parse(req.url, true).query;
  let hashTags = Object.entries(queryObject);
  let ApplicantsData;
  if (hashTags[0] != undefined){
    if (hashTags[0][0] == 'search'){
      //검색창에 무언가를 검색했으므로 태그 무시하고 검색으로만 찾음
      if (hashTags[1][1] == "realname"){
        //이름 으로 검색했다면
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
        //회원번호 로 검색했다면
        if (hashTags[1][1].length != 6){
          //34로 검색해도 000034로 검색되게 변경
          hashTags[0][1] = ('000000' + hashTags[0][1]).slice(-6);
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
      //검색 옵션 늘리려면 여기서 else if (hashTags[1][1] == "새로운 검색옵션")}
      //혹은 switch문 사용
        next();
      }
    }else{
      next();
    }
  }else{
    next();
  }
};


//관리자 페이지 조회
router.get('/adminPage/:category/:pageNum', isAdmin, applicantController.getAllApplicants, categoryController.getAllCategories, searchCheck, (req, res) => {
  let ApplicantsData = req.applicantsData;
  let CategoryData = req.categoriesData.find((category)=>
    category.categoryName == req.params.category
  );

  const queryObject = url.parse(req.url, true).query;
  let hashTags = Object.entries(queryObject);

  //주어진 queryObject로 ApplicantsData 수정
  if (hashTags[0] != undefined){
    if (hashTags[0][0] != 'search'){
      //검색창에 입력한게 없으므로 태그 적용
      outer : for (var i=0; i<ApplicantsData.length; i++){
        //category 검사해서 맞지 않는 applicant는 삭제
        //지금은 category 'illustrator' 1개뿐이므로 비활성화
        /*
        if(!ApplicantsData[i].categories.includes(req.params.category)){
          ApplicantsData.splice(i, 1);
          i--;
          continue;
        }
        */
        for (var j=0; j<hashTags.length; j++){
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
    //태그도 없고 검색도 안함.
    //category 검사해서 맞지 않는 applicant는 삭제
    //지금은 category 'illustrator' 1개뿐이므로 비활성화
    /*
    for (var i=0; i<ApplicantsData.length; i++){
      if(!ApplicantsData[i].categories.includes(req.params.category)){
        ApplicantsData.splice(i, 1);
        i--;
        continue;
      }
    }
    */
  }

  //사용자를 updateDate 기준으로 정렬
  ApplicantsData.sort((a,b)=>{
    if (a.updateDate < b.updateDate) return 1;
    else return -1;
  });

  //페이지네이션
  let maxPage = parseInt(ApplicantsData.length / pageSize);
  if (ApplicantsData.length % pageSize != 0) {
    maxPage++;
  }

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

  if (CategoryData == undefined){
    res.render('errorPage',{
      errorDetail: '존재하지 않는 카테고리입니다'
    });
  }else{
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
  }
});

//관리자 페이지에서 검색
router.post('/adminPage/:category/:pageNum', isAdmin, categoryController.getAllTags, (req, res) => {
  let queryString = "/adminPage/" + req.params.category + "/" + req.params.pageNum + "?";
  //검색창에 무언가를 검색했을 경우
  if (req.body.targetName.length != 0){
    queryString += ("search="+req.body.targetName + "&");
    queryString += ("searchOption="+req.body.searchOption + "&");
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


//즐겨찾기한 사용자들만 불러오기
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

router.get('/scrapList/:category/:pageNum', isAdmin, categoryController.getAllCategories, scrapList, (req, res)=>{
  let ApplicantsData = req.applicantsData;
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
  //최근에 즐겨찾기한 사람이 제일 먼저 보이도
  ApplicantsData.reverse();

  //페이지네이션
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
router.post('/scrapApplicant/:applicantId', isAdmin, (req, res)=>{
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
router.post('/unscrapApplicant/:applicantId', isAdmin, (req, res)=>{
  Applicant.updateOne({_id: req.user._id}, {$pull : {scrapList: req.params.applicantId}}, (error, applicant)=>{
    if (error){
      console.log('error at unscrapApplicant'+error);
    }else{
    }
  });
  res.send('ok');
})

//공지사항 게시판
//공지사항 생성 페이지
router.get('/noticeboard/create', csrfProtection, isAdmin, (req, res)=>{
  res.render('notice_createNotice',{
    csrfToken: req.csrfToken(),
  });
});
//공지사항 생성
router.post('/noticeboard/create', isAdmin, nodemailerController.upload.array('file'), csrfProtection, noticeController.getTotalNotice, noticeController.createNotice, (req, res, error)=>{
  if (error){
    console.log('error at create notice' + error);
  }
  res.redirect('/noticeboard/1');
});
//공지사항 삭제
router.get('/noticeboard/deleteNotice/:noticeNumber', isAdmin, (req, res)=>{
  noticeController.deleteNotice(req, res, req.params.noticeNumber);
  res.redirect('/noticeboard/1');
});
//공지사항 게시글 조회
router.get('/noticeboard/views/:noticeNumber', noticeController.findNotice, (req, res)=>{
  if(req.noticesData.length){
    res.render('notice_noticeArticle',{
      Notices: req.noticesData,
    });
  }else{
    res.render('errorPage',{
      errorDetail: '존재하지 않는 공지사항입니다'
    })
  }
});
//공지사항 게시판 조회
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
//제휴문의
//제휴문의 게시판 조회
router.get('/contactboard/:pageNum', isAdmin, noticeController.getAllContacts,(req, res)=>{
  let ContactsData = req.contactsData;
  ContactsData.reverse();

  let maxPage = parseInt(ContactsData.length / pageSize_notice);
  if (ContactsData.length % pageSize_notice != 0){
    maxPage++;
  }
  if (req.params.pageNum > maxPage)
    req.params.pageNum = maxPage;
  if (req.params.pageNum == 0)
    req.params.pageNum = 1;
  if (maxPage ==0) maxPage++;

  ContactsData = ContactsData.slice((req.params.pageNum - 1) * pageSize_notice, req.params.pageNum * pageSize_notice);

  res.render('notice_contactboard',{
    Contacts: ContactsData,
    pageNum: req.params.pageNum,
    maxPage: maxPage,
  });
});
//제휴문의 게시글 조회
router.get('/contactboard/views/:contactNumber', isAdmin, noticeController.findContact, (req, res)=>{
  if(req.contactsData.length){
    res.render('notice_contactArticle',{
      Contacts: req.contactsData,
    });
  }else{
    res.render('errorPage',{
      errorDetail: '존재하지 않는 제휴문의입니다'
    })
  }
});
//제휴문의 삭제
router.get('/contactboard/deleteContact/:contactNumber', isAdmin, (req, res)=>{
  noticeController.deleteContact(req, res, req.params.contactNumber);
  res.redirect('/contactboard/1');
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
router.get('/deleteArticle/:articleId', isAdmin, (req, res) => {
  articleController.deleteArticle(req, res, req.params.articleId);
  res.redirect('/applicants/' + req.user.username);
});

//태그 부여
router.get('/attachTag/:applicantEmail/:tag/:adminId', isAdmin, (req, res)=>{
  categoryController.attachTag(req, res);
});

//태그 취소
router.post('/detachTag/:applicantEmail/:tag/:adminId', isAdmin, (req, res)=>{
  categoryController.detachTag(req, res);
});

//태그 생성
router.post('/createTag/:categoryName', isAdmin, (req, res)=>{
  categoryController.createTag(req, res, req.params.categoryName);
});

//태그 삭제
router.get('/deleteTag/:categoryName/:tag', isAdmin, (req, res)=>{
  categoryController.deleteTag(req, res, req.params.categoryName);
});

//관리자 임명
router.get('/appointAdmin/:applicantEmail', isAdmin, (req, res)=>{
  applicantController.appointAdmin(req, res);
  res.redirect('/applicants/'+req.params.applicantEmail);
});

//관리자가 확인하였습니다
router.get('/checkDateUpdate/:applicantEmail', isAdmin, (req, res)=>{
  applicantController.checkDateUpdate(req, res);
  res.redirect('/applicants/'+req.params.applicantEmail);
});

//양식 수정하기
router.get('/categoryUpdate', isAdmin, categoryController.getAllCategories, (req, res)=>{
  let CategoryData = req.categoriesData.find((category)=>
    category.categoryName == 'illustrator'
  );
  res.render('categoryUpdate', {
    curCategory: CategoryData,
  });
});

router.post('/categoryUpdate', isAdmin, nodemailerController.uploadFields, (req, res)=>{
  categoryController.updateCategory(req, res, 'illustrator');

  res.redirect('/adminPage/illustrator/1');
});

module.exports = router;
