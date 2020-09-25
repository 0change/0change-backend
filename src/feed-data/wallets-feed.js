const blockchain = require('../blockchain');
const Model = require('../database/mongooseModels/Wallet')

module.exports = function () {
  console.log('feeding wallets ...')
  let i = -1
  const onDocumentSaved = () => {
    i++
    if (i < 20) {
      // console.log("inserting document: ", documentsToFeed[i]);
      let account = blockchain.createWallet();
      let doc = new Model({
        address: account.address,
        privateKey: account.privateKey
      })
      return doc.save().then(onDocumentSaved)
    }
  }
  return Promise.resolve().then(onDocumentSaved)
}
