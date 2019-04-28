module.exports = function (param) {
  let valid = /^[0-9a-fA-F]{24}$/.test(param);
  return !valid ? `'${param}' is not valid ObjectId` : null;
}