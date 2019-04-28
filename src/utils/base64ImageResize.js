const sharp = require('sharp');
module.exports = function (base64Image, width, height) {
  return new Promise(function (resolve, reject) {
    let parts = base64Image.split(';');
    let mimType = parts[0].split(':')[1];
    let imageData = parts[1].split(',')[1];

    var img = new Buffer(imageData, 'base64');
    sharp(img)
        // .jpeg({ quality: 70, progressive: true })
        .resize(width, height)
        .toBuffer()
        .then(resizedImageBuffer => {
          let resizedImageData = resizedImageBuffer.toString('base64');
          resolve(`data:${mimType};base64,${resizedImageData}`);
        })
        .catch(error => {
          reject(error)
        })
  })
}