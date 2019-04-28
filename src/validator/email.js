module.exports = function (param) {
  if (typeof param !== 'string'){
    return `'${param}' is not valid email`;
  }
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  let valid = re.test(String(param).toLowerCase());
  return !valid ? `'${param}' is not valid email` : null;
};