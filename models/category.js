//mongoose
const mongoose = require('mongoose');


//defining schema
const categorySchema = mongoose.Schema({
  categoryName: 'string',
  hashTags: 'array',
  fileNames : 'array',
  fileDesc : 'array',
  categoryDesc : 'array',
}, {
  collection: 'category'
});




module.exports = mongoose.model('Category', categorySchema);
