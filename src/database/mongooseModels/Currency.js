const mongoose = require('mongoose');
let allDocuments = [];

let currencySchema = mongoose.Schema({
  title: String,
  code: {type: String, unique: true}
}, {timestamps: true});

function validateCode(code){
  let index = allDocuments.findIndex(item => item.code === code);
  return index >= 0;
}

function findByCode(code){
  let index = allDocuments.findIndex(item => item.code === code);
  return allDocuments[index];
}

let Model = module.exports = mongoose.model('currency', currencySchema);
module.exports.validateCode = validateCode;
module.exports.findByCode = findByCode;

// preload model
Model.find({}).then(documents => {
  allDocuments = documents;
})