//mongoose
const mongoose = require('mongoose');

const scoreSchema = mongoose.Schema({
  raterId : 'array',
  raterScore : 'array',
  avgScore : 'array',
  score : 'number'
})

//defining schema
const articleSchema = mongoose.Schema({
  userId : 'string',
  userEmail : 'string',
  files : 'array',
  comment : 'string',
  url : 'string',
  createDate : 'date',
  scoreInfo : [scoreSchema]
}, {
  collection: 'article'
});




module.exports = mongoose.model('Article', articleSchema);
