const Applicant = require('./../models/applicant');
const passport = require('passport');
//mongoose
const articleController = require('./../controllers/articleController');

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
  }
  console.log("target email");
  console.log(targetEmail);
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
exports.deleteApplicant = (req, res) => {
  //먼저 찾음
  let targetEmail;
  if (req.params.username) {
    targetEmail = req.params.username;
  } else if (req.body.username) {
    targetEmail = req.body.username;
  } else {
    console.log("no email found");
    return;
  }
  Applicant.find({
    username: req.body.username
  }, (error, applicant) => {
    if (error) {
      console.log('error in deleting user');
      console.log(error);
    } else {
      //연결된 게시글 모두 삭제
      //article.find로 다 불러와서 다 삭제?
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
      console.log("createApplicant success");
      //바로 로그인
      articleController.saveArticle(req, res, applicant._id);
    }
  });
  passport.authenticate("local")(req, res, () => {
    console.log("registered and logged in as: ");
    console.log(req.user);
  });
  console.log("user at end of createApplicant");
  console.log(req.user);
};
