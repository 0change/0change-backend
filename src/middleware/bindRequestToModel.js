const fs = require('fs');
const path = require('path');

let allModels = {};

var normalizedPath = path.join(__dirname, "../database/mongooseModels");

fs.readdirSync(normalizedPath).forEach(function(file) {
  if(path.extname(file).toLowerCase() === '.js'){
    let modelName = path.basename(file, '.js');
    let modelPath = "../database/mongooseModels/" + file;
    let model = require(modelPath);
    // console.log(`${model.collection.collectionName}:${modelName}`);//.collection.NativeCollection.collectionName
    // let relations = model.schema.tree;
    allModels[modelName] = {
      file: file,
      path: modelPath,
      collectionName: model.collection.collectionName,
      model
    };
  }
});


module.exports = function () {
  let orms = [];
  for(let i=0 ; i<arguments.length ; i++){
    if(typeof arguments[i] === 'string') {
      let [param, modelName] = arguments[i].split(":");
      if(!allModels[modelName] || !allModels[modelName].model)
        throw {message: `Unknown model [${modelName}] for bind to request params.`};
      orms.push({param, model: allModels[modelName].model});
    }
  }
  return function (req, res, next) {
    let allPromise = [];
    for(let i=0 ; i<orms.length ; i++){
      let {param, model} = orms[i];
      console.log(model.collection.NativeCollection);
      allPromise.push(model.findOne({_id: req.body[param]}))
    }
    Promise.all(allPromise)
        .then(allValue => {
          for(let i=0 ; i<orms.length ; i++){
            let {param} = orms[i];
            req.body[param] = allValue[i];
          }
          next();
        })
        .catch(error => {
          return res.status(400).json({
            success: false,
            message: error.message,
            error
          });
        });
  }
}

module.exports.isModelToBind = function(modelName){
    return !!allModels[modelName];
}

module.exports.bind = function(modelName, documentId){
  return new Promise(function (resolve, reject) {
      allModels[modelName].model.findOne({_id: documentId})
          .then(doc => {
            if(doc)
              resolve(doc);
            else{
              reject({message: `${modelName} not found with id: ${documentId}`})
            }
          })
          .catch(reject)
  })
}