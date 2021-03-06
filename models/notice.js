//mongoose
const mongoose = require('mongoose');
const Applicant = require('./applicant');


//defining schema
const noticeSchema = mongoose.Schema({
  noticeNumber: 'string',
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Applicant"
  },
  adminName: 'string',
  title: 'string',
  content: 'string',
  file: 'string',
  createDate: 'string',
}, {
  collection: 'notice'
});




module.exports = mongoose.model('Notice', noticeSchema);
