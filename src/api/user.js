const randomString = require("../utils/randomString");
const {Router} = require('express');
const User = require('../database/mongooseModels/User');
const Token = require('../database/mongooseModels/Token');
const Transaction = require('../database/mongooseModels/Transaction');
const Feedback = require('../database/mongooseModels/Feedback');
const requireParam = require('../middleware/requestParamRequire');
const objUtil = require('../utils/object');
let router = Router();

function checkUsernameAvailable(username) {
  if (username.length < 6) {
    return Promise.reject({message: "Username most be at least 6 characters."});
  }
  return User.findOne({username: new RegExp(`^${username}$`, "i")})
      .then(user => {
        if (user)
          throw {message: 'This username already taken'}
      })
}

function checkEmailAvailable(email) {
  return User.findOne({email: new RegExp(`^${email}$`, "i")})
      .then(user => {
        if (user)
          throw {message: 'This email already registered'}
      })
}

router.all('/get-info', function (req, res, next) {
  let userId = req.body.userId;
  let user = null;
  let userInfoPromise = null;
  if (!userId) {
    userInfoPromise = Promise.resolve(req.data.user);
  } else {
    userInfoPromise = User.findOne({_id: userId});
  }
  userInfoPromise
      .then(_user => {
        user = _user;
        if (req.body.feedback) {
          return Feedback.find({user: user._id})
        } else {
          return null;
        }
      })
      .then(feedbacks => {
        let response = {
          success: true,
          user
        };
        if (req.body.feedback)
          response.feedbacks = feedbacks;
        res.json(response);
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          message: error.message || "Server side error",
          error
        });
      })
});

router.post('/check-username', requireParam('username:string'), function (req, res, next) {
  let username = req.body.username;
  checkUsernameAvailable(username)
      .then(() => {
        res.send({
          success: true,
          message: 'Username is available'
        })
      })
      .catch(error => {
        res.send({
          success: false,
          message: error.message || 'server side error',
          error: error
        })
      })
})

router.post('/update-username', requireParam('username:string'), function (req, res, next) {
  let username = req.body.username;
  checkUsernameAvailable(username)
      .then(() => {
        let user = req.data.user;
        user.username = username;
        return user.save();
      })
      .then(() => {
        res.send({
          success: true,
          message: 'Username updated successfully'
        })
      })
      .catch(error => {
        res.send({
          success: false,
          message: error.message || 'server side error',
          error: error
        })
      })
})

router.post('/check-email', requireParam('email:email'), function (req, res, next) {
  let email = req.body.email;
  checkEmailAvailable(email)
      .then(() => {
        res.send({
          success: true,
          message: 'Email is not registered'
        })
      })
      .catch(error => {
        res.send({
          success: false,
          message: error.message || 'server side error',
          error: error
        })
      })
})

router.post('/update-email', requireParam('email:email'), function (req, res, next) {
  let email = req.body.email;
  checkEmailAvailable(email)
      .then(() => {
        let user = req.data.user;
        user.email = email;
        return user.save();
      })
      .then(() => {
        res.send({
          success: true,
          message: 'Email updated successfully'
        })
      })
      .catch(error => {
        res.send({
          success: false,
          message: error.message || 'server side error',
          error: error
        })
      })
})

router.post('/update', function (req, res, next) {
  let user = req.data.user;
  let update = {};
  if (req.body.firstName !== undefined && typeof req.body.firstName === 'string')
    update.firstName = req.body.firstName;
  if (req.body.lastName !== undefined && typeof req.body.lastName === 'string')
    update.lastName = req.body.lastName;
  if (req.body.about !== undefined && typeof req.body.about === 'string')
    update.about = req.body.about;
  if (req.body.country !== undefined && typeof req.body.country === 'string')
    update.country = req.body.country;
  if (req.body.mobile !== undefined && typeof req.body.mobile === 'string') {
    update.mobile = req.body.mobile;
    update.mobileConfirmed = false;
  }
  Object.keys(update).map(key => {
    user[key] = update[key]
  });
  user.save();
  res.send({
    success: true,
    message: 'User data updated',
    updatedFields: update
  })
  // let user = req.data.user;
  // return user.save();
})

router.post('/transactions', function (req, res, next) {
  let currentUser = req.data.user;

  currentUser.getBalance()
      .then(({transactions, balance}) => {
        res.send({
          success: true,
          balance,
          transactions
        })
      })
      .catch(error => {
        res.status(500).send({
          success: false,
          message: error.message || "",
          error
        })
      })
})

router.post('/fake-deposit', requireParam('token', 'amount:number'), function (req, res, next) {
  let token = Token.findByCode(req.body.token);
  let amount = req.body.amount;
  let currentUser = req.data.user;

  if (!token) {
    return res.send({
      success: false,
      message: 'Token invalid.'
    })
  }

  new Transaction({
    type: Transaction.TYPE_DEPOSIT,
    amount: amount,
    token: token.code,
    status: Transaction.STATUS_DONE,
    txHash: '0x' + randomString(64, '0123456789abcdef'),
    from: '0x' + randomString(40, '0123456789abcdef'),
    to: currentUser.address,
    txTime: Date.now(),
  }).save()
      .then(() => currentUser.getBalance())
      .then(({transactions, balance}) => {
        res.send({
          success: true,
          balance,
          transactions
        })
      })
      .catch(error => {
        res.status(500).send({
          success: false,
          message: error.message || "",
          error
        })
      })
})

router.post('/withdraw', requireParam('token', 'amount:number', 'to:address'), function (req, res, next) {
  let token = Token.findByCode(req.body.token);
  let amount = req.body.amount;
  let to = req.body.to;
  let currentUser = req.data.user;

  if (!token) {
    return res.send({
      success: false,
      message: 'Token invalid.'
    })
  }

  currentUser.getBalance()
      .then(({balance}) => {
        if (amount <= 0)
          throw {message: 'Token amount most be positive value'};
        if (amount > balance[token.code])
          throw {message: 'Token balance is not sufficient'};
        return new Transaction({
          type: Transaction.TYPE_WITHDRAW,
          amount: amount,
          token: token.code,
          status: Transaction.STATUS_DONE,
          txHash: '0x' + randomString(64, '0123456789abcdef'),
          from: currentUser.address,
          to: to,
          txTime: Date.now(),
        }).save()
      })
      .then(() => currentUser.getBalance())
      .then(({transactions, balance}) => {
        res.send({
          success: true,
          balance,
          transactions
        })
      })
      .catch(error => {
        res.status(500).send({
          success: false,
          message: error.message || "",
          error
        })
      })
})

module.exports = router;