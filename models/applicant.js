//mongoose
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Article = require('./article');

//defining schema
const applicantSchema = mongoose.Schema({
  username: 'string',
  realname: 'string',
  position: 'string',
  route: 'string',
  file: 'string',
  portfolio: 'string',
  createDate: 'date',
  updateDate: 'date',
  isAdmin: 'bool',
  isVerified: 'bool',
  verifyKey: 'string',
  articles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Article"
  }],
  tagInfo: [{
    taggerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant"
    },
    tag: 'string'
  }],
  userTags: 'array',
  categories: 'array',
}, {
  collection: 'applicant'
});


applicantSchema.plugin(passportLocalMongoose, {
  //usernameField: "email"
});


let Applicant = mongoose.model('Applicant', applicantSchema);
module.exports = Applicant;
//module.exports = mongoose.model('Applicant', applicantSchema);
