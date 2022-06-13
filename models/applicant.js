//mongoose
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Article = require('./article');

//defining schema
const applicantSchema = mongoose.Schema({
  applicantNumber: 'string',
  username: 'string',
  realname: 'string',
  position: 'string',
  sex: 'string',
  birth: 'string',
  phone: 'string',
  style: 'string',
  status: 'string',
  file: 'string',
  fileNames : 'array',
  url: 'string',
  createDate: 'string',
  updateDate: 'string',
  checkDate: 'string',
  isAdmin: 'bool',
  isVerified: 'bool',
  verifyKey: 'string',
  articles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Article"
  }],
  tagInfo: [{
    taggerId: 'string',
    tag: 'string'
  }],
  userTags: 'array',
  categories: 'array',
  scrapList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Applicant"
  }],
}, {
  collection: 'applicant'
});


applicantSchema.plugin(passportLocalMongoose, {
  //usernameField: "email"
});


let Applicant = mongoose.model('Applicant', applicantSchema);
module.exports = Applicant;
//module.exports = mongoose.model('Applicant', applicantSchema);
