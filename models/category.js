//mongoose
const mongoose = require('mongoose');


//defining schema
const categorySchema = mongoose.Schema({
  categoryName: 'string',
  hashTags: 'array',
}, {
  collection: 'category'
});




module.exports = mongoose.model('Category', categorySchema);
