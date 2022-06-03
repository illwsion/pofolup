//mongoose
const mongoose = require('mongoose');


//defining schema
const pofolupSchema = mongoose.Schema({
  totalUser: 'number',
}, {
  collection: 'pofolupDB'
});




module.exports = mongoose.model('Pofolup', pofolupSchema);
