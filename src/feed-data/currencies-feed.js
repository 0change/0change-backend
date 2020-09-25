const documentsToFeed = require('./currencies.json')
const Model = require('../database/mongooseModels/Currency')

module.exports = function () {
  console.log('feeding currencies ...')
  let i = -1
  const onDocumentSaved = () => {
    i++
    if (i < documentsToFeed.length) {
      // console.log("inserting document: ", documentsToFeed[i]);
      let doc = new Model(documentsToFeed[i])
      return doc.save().then(onDocumentSaved)
    }
  }
  return Promise.resolve().then(onDocumentSaved)
}
