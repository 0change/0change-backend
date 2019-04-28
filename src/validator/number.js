module.exports = function (param) {
  let valid = !isNaN(param);
  return !valid ? `'${param}' is not valid number` : null;
};