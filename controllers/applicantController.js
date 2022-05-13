const Applicant = require('./../models/applicant');
const passport = require('passport');
const crypto = require('crypto');
//mongoose
const articleController = require('./../controllers/articleController');
const s3Controller = require('./../controllers/s3Controller');
const nodemailerController = require('./../controllers/nodemailerController');

exports.getAllApplicants = (req, res, next) => {
  Applicant.find({}, (error, applicants) => {
    if (error) {
      console.log(err);
    } else {
      req.applicantsData = applicants;
      next();
    }
  });
};

exports.findApplicantById = async (req, res, applicantId)=>{
  console.log('findapplicantbyid');
  await Applicant.findById(applicantId, (error, applicant)=>{
    if (error) {
      console.log('applicant not found');
      console.log(error);
    } else {
      console.log('applicant found');
      req.applicantsData = applicant;
    }
  });
};

//email로 사용자 검색
exports.findApplicant = (req, res, next) => {
  //params, body 양쪽으로 들어와도 검색 가능
  console.log(req.body);
  let targetEmail;
  if (req.params.username) {
    targetEmail = req.params.username;
  } else if (req.body.username) {
    targetEmail = req.body.username;
  } else {
    console.log("no email found");
    next();
  }
  Applicant.find({
    username: targetEmail
  }, (error, applicant) => {
    if (error) {
      console.log(error);
    } else {
      req.applicantsData = applicant;
      next();
    }
  });
};

exports.verifyApplicant = (req, res, verifyKey) => {
  Applicant.find({verifyKey: verifyKey}, (error, applicant)=>{
    console.log('found applicant by verifyKey');
    console.log(applicant);
    if (error){
      console.log('error at finding applicant by verifyKey');
      res.render('errorPage', {
        errorDetail: '인증 코드에 해당하는 아이디를 찾지 못했습니다'
      });
    }
    else{
      applicant = applicant[0];
      if (applicant == undefined){
        res.render('errorPage', {
          errorDetail: '인증 코드에 해당하는 아이디를 찾지 못했습니다',
        });
      }
      else{
        applicant.isVerified = true;
        applicant.save();
        res.redirect('/');
      }


    }
  });
};

exports.checkVerify = (req, res, applicantId) => {

};

exports.deleteApplicant = (req, res, applicantId) => {
  //console.log('사용자 삭제 시도');
  Applicant.findById(applicantId, async (error, applicant) => {
    if (error) {
      console.log(error);
    } else {
      console.log('사용자 삭제');
      //연결된 게시글 모두 삭제
      for (var i = 0; i < applicant.articles.length; i++) {
        //console.log("for 게시글 삭제");
        await articleController.deleteArticle(req, res, applicant.articles[i]);
        console.log(applicant.articles.length);
      }
      //썸네일 파일 삭제
      s3Controller.s3Delete(req, res, applicant.file);
      s3Controller.s3Delete(req, res, applicant.portfolio);
      //유저 삭제
      Applicant.deleteOne({
        _id: applicant._id
      }, (error, result) => {
        console.log('applicant.deleteOne');
        if (error) {
          console.log('error at deleteApplicant');
          console.log(error);
        } else {
          //console.log('유저 삭제 성공');
        }
      });
    }
  });
};

//사용자 정보 수정 어떻게 할 것인지 고민
exports.updateApplicant = (req, res) => {

};

exports.createApplicant = (req, res) => {
  console.log('req.files');
  console.log(req.files);
  let newApplicant = new Applicant({
    username: req.body.username,
    realname: req.body.realname,
    position: '그림작가',
    route: req.body.route,
    file: req.files[0].filename,
    portfolio: req.files[1].filename,
    url: req.body.url,
    createDate: new Date().getTime(),
    updateDate: new Date().getTime(),
    isAdmin: false,
    isVerified: true,
    verifyKey: crypto.randomBytes(16).toString('hex'),
  });

  Applicant.register(newApplicant, req.body.password, (error, applicant) => {
    if (error) {
      console.log('error while user register!', error);
    } else {
      //console.log("createApplicant success");
      //s3에 썸네일 이미지 업로드
      s3Controller.s3Upload(req, res, req.files[0].filename);
      s3Controller.s3Upload(req, res, req.files[1].filename);
      //verify code 전송
      console.log('created key');
      console.log(applicant.verifyKey);
      nodemailerController.sendVerificationMail(req, res, applicant.username, applicant.verifyKey);
    }
  });
  passport.authenticate("local")(req, res, () => {
    //console.log("registered and logged in as: ");
    //console.log(req.user);
  });
};

exports.attachTag = async (req, res)=>{
  let username = "/applicants/";
  let numOfAdmin;

  await Applicant.find()
    .where('isAdmin').equals(true)
    .exec((error, admin)=>{
      if (error){
        console.log('query admin error');
      }
      else{
        console.log('query admin success');
        console.log(admin.length);
        numOfAdmin = admin.length;
      }
    });


  await Applicant.findById(req.params.applicantId, (error, applicant)=>{
    if (error){
      console.log('error at attachTag');
      console.log(error);
      res.render('errorPage');
    } else{
      username += applicant.username;
      let tagInfo = {
        taggerId: req.params.adminId,
        tag: req.params.tag
      };
      let numOfTag = 0;
      let alreadyExist = false;
      applicant.tagInfo.forEach((tagInfo, i) => {
        if (tagInfo.tag == req.params.tag){
          numOfTag++;
          if (tagInfo.taggerId == req.params.adminId){
            alreadyExist = true;
          }
        }
      });
      if (!alreadyExist){
        applicant.tagInfo.push(tagInfo);
        applicant.updateDate = new Date().getTime();
        //tagInfo 검사해서 과반수 이상이고 이미 없으면 usertags에 추가
        console.log('수');
        console.log(parseInt((numOfAdmin-1)/2) + 1);
        console.log(numOfTag + 1);
        if ((parseInt((numOfAdmin-1)/2) + 1) <= numOfTag + 1){
          if (applicant.userTags.indexOf(req.params.tag) == -1){
            applicant.userTags.push(req.params.tag);
          }else{
            console.log('이미 있는 태그');
          }
        }
        applicant.save();
      }
      else{
        //console.log('이미 태그를 누른 적 있음');
      }
      res.redirect(username);
    }
  }).clone();


};
