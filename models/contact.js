//mongoose
const mongoose = require('mongoose');

//defining schema
const noticeSchema = mongoose.Schema({
  contactNumber: 'string',
  companyName: 'string',
  enquireName: 'string',
  phone: 'string',
  email: 'string',
  item: 'array',
  content: 'string',
  createDate: 'string',
}, {
  collection: 'contact'
});




module.exports = mongoose.model('Contact', noticeSchema);
