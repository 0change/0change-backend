
function publicKeyToAddress(publicKey){
  return "0x" + publicKey.substr(publicKey.length - 40, 40);
}

module.exports = {
  publicKeyToAddress
}