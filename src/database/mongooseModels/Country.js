const mongoose = require('mongoose');

let countrySchema = mongoose.Schema({
  name: String,
  code: {type: String, unique: true}
});

module.exports = mongoose.model('country', countrySchema);