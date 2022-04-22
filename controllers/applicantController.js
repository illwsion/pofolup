const Applicant = require('./../models/applicant');

//mongoose
const articleController = require('./../controllers/articleController');

exports.getAllApplicants = (req, res, next)=>{
  Applicant.find({}, (error, applicants)=>{
    if (error){
        console.log(err);
    }else{
      req.data = applicants;
      next();
    }
  });
};

exports.saveApplicant = (req, res)=>{
  let fileArray = [];
  console.log(req.files);
  for (var i=0; i<req.files.length; i++){
    fileArray.push(req.files[i].filename);
    console.log(fileArray);
  }
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
    console.log("applicant save complete");
    console.log(result);
    articleController.saveArticle(req, res, result._id);

  });
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
