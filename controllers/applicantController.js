const Applicant = require('./../models/applicant');
const passport = require('passport');
//mongoose
const articleController = require('./../controllers/articleController');
const s3Controller = require('./../controllers/s3Controller');

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


//아직 미구현
exports.deleteApplicant = (req, res, applicantId) => {
  //console.log('사용자 삭제 시도');
  Applicant.findById(applicantId, async (error, applicant) => {
    if (error) {
      console.log(error);
    } else {
      //연결된 게시글 모두 삭제
      for (var i = 0; i < applicant.articles.length; i++) {
        //console.log("for 게시글 삭제");
        await articleController.deleteArticle(req, res, applicant.articles[i]);
        console.log(applicant.articles.length);
        if (i == applicant.articles.length - 1) {
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
      }
      //썸네일 파일 삭제
      s3Controller.s3Delete(req, res, applicant.file);
      //유저 삭제
    }
  });
};

//사용자 정보 수정 어떻게 할 것인지 고민
exports.updateApplicant = (req, res) => {

};

exports.createApplicant = (req, res) => {
  let newApplicant = new Applicant({
    username: req.body.username,
    realname: req.body.realname,
    position: '그림작가',
    route: req.body.route,
    file: req.files[3].filename,
    url: req.body.url,
    createDate: new Date().getTime(),
    updateDate: new Date().getTime(),
    isAdmin: false,
  });

  Applicant.register(newApplicant, req.body.password, (error, applicant) => {
    if (error) {
      console.log('error while user register!', error);
    } else {
      //console.log("createApplicant success");
      //s3에 썸네일 이미지 업로드
      s3Controller.s3Upload(req, res, req.files[3].filename);
      //바로 로그인
      articleController.saveArticle(req, res, applicant._id);
    }
  });
  passport.authenticate("local")(req, res, () => {
    //console.log("registered and logged in as: ");
    //console.log(req.user);
  });
};
