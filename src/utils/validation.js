exports.mobileNumebr = function (inputtxt) {
  // var regx = /^\+([0-9]{2})[-. ]?([0-9]{3})[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  var regx = /^\+([0-9]{2})([0-9]{10})$/;
  if(inputtxt.match(regx)) {
    return true;
  }
  else {
    return false;
  }
}