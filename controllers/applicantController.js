const Applicant = require('./../models/applicant');

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

exports.findApplicant = (req, res, next)=>{
  //console.log('req.body.email');
  //console.log(req.body.email);
  console.log('req.params.email');
  console.log(req.params.email);
  Applicant.find({email : req.params.email}, (error, applicant)=>{
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

  Applicant.find({email : req.body.email}, (error, applicant)=>{
    if (applicant.length == 0){
      console.log("applicant doesn't exist");
      let newApplicant = new Applicant({
        name: req.body.name,
        email: req.body.email,
        password : req.body.password,
        position : '그림작가',
        route : req.body.route,
        files : fileArray,
        url : req.body.url,
        createDate : new Date().getTime(),
        updateDate : new Date().getTime(),
        isAdmin : false,
      });
      newApplicant.save((error, result) =>{
        if (error) res.send(error);
        //console.log("applicant save complete");
        //console.log(result);
        articleController.saveArticle(req, res, result._id);
      });
    }
    else{
      console.log("applicant exists!");
      articleController.saveArticle(req, res, applicant[0]._id);
    }
  })
};
exports.deleteApplicant = (req, res)=>{


}


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
