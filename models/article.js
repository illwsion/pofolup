//mongoose
const mongoose = require('mongoose');
const Applicant = require('./applicant');


//defining schema
const articleSchema = mongoose.Schema({
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Applicant"
  },
  category: 'string',
  userEmail: 'string',
  files: 'array',
  comment: 'string',
  url: 'string',
  createDate: 'date',
}, {
  collection: 'article'
});




module.exports = mongoose.model('Article', articleSchema);
