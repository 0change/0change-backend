const mongoose = require('mongoose');
let allDocuments = [];

let currentSchema = mongoose.Schema({
  title: {type: String}
});

function validateMethod(method){
  let index = allDocuments.findIndex(item => item._id.toString() === method);
  return index >= 0;
}

const Model = module.exports = mongoose.model('payment-method', currentSchema);
module.exports.validateMethod = validateMethod;

// preload model
Model.find({}).then(documents => {
  allDocuments = documents;
})