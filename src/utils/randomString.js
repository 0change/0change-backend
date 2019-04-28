module.exports = function (length=16, possibleChars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {
  var text = "";

  for (var i = 0; i < length; i++)
    text += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));

  return text;
}