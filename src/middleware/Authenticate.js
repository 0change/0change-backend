const crypto = require('crypto');
var jwt = require('jsonwebtoken');
const User = require('../database/mongooseModels/User');
const mongoose = require('mongoose');

exports.forceAuthorized = function (req, res, next) {
  if (req.data && req.data.user) {
    next();
  } else {
    // if there is no token
    // return an error
    return res.status(401).json({
      success: false,
      message: 'Unauthorized request'
    });
  }
};

function mapTokenToUser(token) {
  return new Promise(function (resolve, reject) {
    jwt.verify(token, process.env.JWT_AUTH_SECRET, function (err, decoded) {
      if (err)
        return resolve(null);
      let currentUser = null;
      User.findOne({_id: mongoose.Types.ObjectId(decoded.id)})
          .select('+mobile +email')
          .then(user => {
            if (user) {
              user.lastSeen = Date.now();
              currentUser = user;
              return user.save();
            }
          })
          .then(() => resolve(currentUser))
          .catch(err => resolve(null))

    });
  })
}

exports.setUser = function (req, res, next) {
  if(!req.data)
    req.data = {};
  let token = req.header('authorization');
  if (!!token && token.substr(0, 6).toLowerCase() === 'bearer')
    token = token.substr(7);
  if (token) {
    mapTokenToUser(token)
        .then(user => {
          req.data.user = user;
        })
        .catch(error => {
          console.log('error happenes', error);
        })
        .then(next)
  }
  else
    next();
};
