//mongoose
const mongoose = require('mongoose');


//defining schema
const applicantSchema = mongoose.Schema({
  name: 'string',
  position : 'string',
  number: 'string',
  email: 'string',
  route : 'string',
  file : 'string',
  url : 'string',

}, {
  collection: 'newApplicant'
});




module.exports = mongoose.model('Applicant', applicantSchema);
