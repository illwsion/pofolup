//mongoose
const mongoose = require('mongoose');
const Applicant = require('./applicant');
const scoreSchema = mongoose.Schema({
  raterId: 'array',
  raterScore: 'array',
  avgScore: 'array',
  score: 'number'
})

//defining schema
const articleSchema = mongoose.Schema({
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Applicant"
  },
  userEmail: 'string',
  files: 'array',
  comment: 'string',
  url: 'string',
  createDate: 'date',
  scoreInfo: [scoreSchema]
}, {
  collection: 'article'
});




module.exports = mongoose.model('Article', articleSchema);
