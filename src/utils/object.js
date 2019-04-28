module.exports.mask = function (obj, attrs, inverse) {
  if(!Array.isArray(attrs)) {
    throw {message: "Object.mask accept only array of string"};
  }
  let source = JSON.parse(JSON.stringify(obj));
  let resultObject = inverse ? source : {};
  for(let i=0 ; i<attrs.length ; i++){
    if(typeof attrs[i] === 'string') {
      if(inverse)
        delete resultObject[attrs[i]];
      else
        resultObject[attrs[i]] = source[attrs[i]];
    }
  }
  return resultObject;
}