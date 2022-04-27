const Applicant = require('./../models/applicant');
const passport = require('passport');
//mongoose
const articleController = require('./../controllers/articleController');

exports.getAllApplicants = (req, res, next)=>{
  Applicant.find({}, (error, applicants)=>{
    if (error){
        console.log(err);
    }else{
      req.applicantsData = applicants;
      next();
    }
  });
};
//email로 사용자 검색
exports.findApplicant = (req, res, next)=>{
  //params, body 양쪽으로 들어와도 검색 가능
  console.log(req.body);
  let targetEmail;
  if (req.params.username){
    targetEmail = req.params.username;
  }else if(req.body.username){
    targetEmail = req.body.username;
  }else{
    console.log("no email found");
  }
  console.log("target email");
  console.log(targetEmail);
  Applicant.find({username : targetEmail}, (error, applicant)=>{
    if (error){
      console.log(error);
    }else{
      console.log('@@@@@@applicant at findApplicant');
      console.log(applicant);
      req.applicantsData = applicant;
      next();
    }
  });
};



exports.saveApplicant = (req, res)=>{
  let fileArray = [];
  //console.log(req.files);
  for (var i=0; i<req.files.length; i++){
    fileArray.push(req.files[i].filename);
  }
  Applicant.find({username : req.body.username}, (error, applicant)=>{
    if (applicant.length == 0){
      console.log("applicant doesn't exist");
      let newApplicant = new Applicant({
        realname: req.body.realname,
        password : req.body.password,
        username: req.body.username,
        position : '그림작가',
        route : req.body.route,
        files : fileArray,
        url : req.body.url,
        createDate : new Date().getTime(),
        updateDate : new Date().getTime(),
        isAdmin : false,
      });
      Applicant.register(newApplicant, req.body.password, (err, result)=>{
        if (err){
          console.log('error while user register!', err);
        }
        else{
          articleController.saveArticle(req, res, result._id);
        }
      });
    }
    else{
      console.log("applicant exists!");
      console.log("try login to check password");
      passport.authenticate('local', {failureRedirect: '/position/illustrator'})

      articleController.saveArticle(req, res, applicant[0]._id);
    }
  })
};
exports.deleteApplicant = (req, res)=>{
  //먼저 찾음
  let targetEmail;
  if (req.params.username){
    targetEmail = req.params.username;
  }else if(req.body.username){
    targetEmail = req.body.username;
  }else{
    console.log("no email found");
    return;
  }
    Applicant.find({username : req.body.username}, (error, applicant)=>{
      if (error){
        console.log('error in deleting user');
        console.log(error);
      }
      else{
        //연결된 게시글 모두 삭제
        //유저 삭제
      }


    });
};

exports.createApplicant = (req, res)=>{
  let fileArray = [];
  //console.log(req.files);
  for (var i=0; i<req.files.length; i++){
    fileArray.push(req.files[i].filename);
  }
  let newApplicant = new Applicant({
    username: req.body.username,
    password : req.body.password,
    realname: req.body.realname,
    position : '그림작가',
    route : req.body.route,
    files : fileArray,
    url : req.body.url,
    createDate : new Date().getTime(),
    updateDate : new Date().getTime(),
    isAdmin : false,
  });
  Applicant.register(newApplicant, req.body.password, (error, applicant)=>{
    console.log("applicant.register result");
    console.log(applicant);
    if (applicant){
      console.log("createApplicant success");
      articleController.saveArticle(req, res, applicant._id);
    }
    else{
      console.log("something went wrong");
      console.log(error);
    }
  })

};


/*
//schema -> model
const Applicant = mongoose.model('Schema', applicantSchema);

//generate Instance
const applicant1 = new Applicant({
  name: 'string',
  position : 'string',
  number: 'string',
  email: 'string',
  route : 'string',
  file : 'string',
  url : 'string',
});

//save data into MongoDB
applicant1.save()
  .then(() => {
    console.log(applicant1);
  })
  .catch((err) => {
    console.log('Error : ' + err);
  });
*/
