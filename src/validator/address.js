module.exports = function (param) {
  // TODO : replace with web3 address validator
  let valid = /^0x[0-9A-F]{40}$/i.test(param);
  return !valid ? `'${param}' is not valid address` : null;
};