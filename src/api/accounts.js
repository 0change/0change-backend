const { Router } = require('express');
const User  = require('../database/mongooseModels/User');
const requireParam  = require('../middleware/requestParamRequire');
let router = Router();

router.post('/info', requireParam('username'), function (req, res, next) {
  res.json({
    success: true,
    user: req.data.user
  });
});

router.post('/feedback-send', requireParam('username'), function (req, res, next) {
  res.json({
    success: true,
    user: req.data.user
  });
});

router.post('/feedback-list', requireParam('username'), function (req, res, next) {
  res.json({
    success: true,
    user: req.data.user
  });
});

module.exports = router;