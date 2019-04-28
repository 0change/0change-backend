module.exports = function (param) {
  let valid = typeof param === 'string';
  return !valid ? `'${param}' is not string` : null;
}