//mongoose
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

//defining schema
const applicantSchema = mongoose.Schema({
  username : 'string',
  realname : 'string',
  position : 'string',
  route : 'string',
  files : 'array',
  createDate : 'date',
  updateDate : 'date',
  isAdmin : 'bool'

}, {
  collection: 'applicant'
});


applicantSchema.plugin(passportLocalMongoose, {
  //usernameField: "email"
});



module.exports = mongoose.model('Applicant', applicantSchema);
