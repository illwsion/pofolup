//mongoose
const mongoose = require('mongoose');


//defining schema
const applicantSchema = mongoose.Schema({
  name : 'string',
  email : 'string',
  password : 'string',
  position : 'string',
  route : 'string',
  files : 'array',
  createDate : 'date',
  updateDate : 'date',
  isAdmin : 'bool'

}, {
  collection: 'applicant'
});




module.exports = mongoose.model('Applicant', applicantSchema);
