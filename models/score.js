//mongoose
const mongoose = require('mongoose');


//defining schema
const scoreSchema = mongoose.Schema({
  articleId : 'string',
  rating : 'array',
  scores : 'array',
  totalScore : 'double',
}, {
  collection: 'score'
});




module.exports = mongoose.model('Score', scoreSchema);
