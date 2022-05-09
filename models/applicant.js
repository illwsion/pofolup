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
  createDate: 'date',
  updateDate: 'date',
  isAdmin: 'bool',
  articles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Article"
  }],
  scored_posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Article"
  }],
}, {
  collection: 'applicant'
});


applicantSchema.plugin(passportLocalMongoose, {
  //usernameField: "email"
});



module.exports = mongoose.model('Applicant', applicantSchema);
