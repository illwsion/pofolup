const Applicant = require('./../models/applicant');


exports.getAllApplicants = (req, res, next)=>{

  Applicant.find({}, (error, applicants)=>{
    if (error) next(error);
    req.data = applicants;
    console.log("applicants");
    console.log(applicants);
    next();
  });
};

exports.saveApplicant = (req, res)=>{
  let newApplicant = new Applicant({
    name: req.body.user_name,
    position : req.body.user_job,
    number: req.body.user_phone,
    email: req.body.user_email,
    route : req.body.user_route,
    file : req.file.filename,
    url : req.body.user_url,
  });

  newApplicant.save((error, result) =>{
    if (error) res.send(error);
    console.log("save complete");


  });
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
