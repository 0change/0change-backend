const mkdirp = require('./mkdirP');
const fs = require('fs');

module.exports = function (dir) {
  // eslint-disable-next-line no-undef
  return new Promise(function (resolve, reject) {
    mkdirp(dir, function(err){
        if (err)
          reject(err);
        else{
          resolve();
        }
    });
  })
}