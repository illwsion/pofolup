//mongoose
const mongoose = require('mongoose');


//defining schema
const boardSchema = mongoose.Schema({
  name: 'string',
}, {
  collection: 'board'
});




module.exports = mongoose.model('Board', boardSchema);
