const mongoose = require('mongoose');
let allDocuments = [];

let tokenSchema = mongoose.Schema({
  title: String,
  code: {type: String, unique: true},
  type: {
    type: String,
    enum: ['ERC20'],
  },
  info: Object,
}, {timestamps: true});

function validateCode(code){
  let index = allDocuments.findIndex(item => item.code === code);
  return index >= 0;
}

function findByCode(code){
  let index = allDocuments.findIndex(item => item.code === code);
  return allDocuments[index];
}

function findById(_id){
  let index = allDocuments.findIndex(item => item._id.toString() === _id.toString());
  return allDocuments[index];
}

// update token list when tokens changed.
tokenSchema.pre('save', function(next){
  let index = allDocuments.findIndex(item => item._id === this._id);
  if(index){
    allDocuments[index] = this;
  }else{
    allDocuments.push(this);
  }
  next();
});

const Model = module.exports = mongoose.model('crypto_token', tokenSchema);
module.exports.validateCode = validateCode;
module.exports.findByCode = findByCode;
module.exports.findById = findById;

// preload tokens
Model.find({}).then(documents => {
  allDocuments = documents;
})