const { Router } = require('express');
const Token = require('../database/mongooseModels/Token')
const Currency = require('../database/mongooseModels/Currency')
const Country = require('../database/mongooseModels/Country')
const PaymentMethod = require('../database/mongooseModels/PaymentMethod')
const requireParam = require('../middleware/requestParamRequire');
let router = Router();

router.all('/tokens', function (req, res, next) {
  Token.find({})
      .then(tokens => {
        res.json({
          success: true,
          tokens
        });
      })
      .catch(error => {
        res.status(500).send({
          success: false,
          message: 'Server side error',
          error
        });
      })
});

router.all('/currencies', function (req, res, next) {
  Currency.find({})
      .then(currencies => {
        res.json({
          success: true,
          currencies
        });
      })
      .catch(error => {
        res.status(500).send({
          success: false,
          message: 'Server side error',
          error
        });
      })
});

router.all('/countries', function (req, res, next) {
  Country.find({})
      .then(countries => {
        res.json({
          success: true,
          countries
        });
      })
      .catch(error => {
        res.status(500).send({
          success: false,
          message: 'Server side error',
          error
        });
      })
});

router.all('/payment-methods', function (req, res, next) {
  PaymentMethod.find({})
      .then(allPaymentMethods => {
        res.json({
          success: true,
          allPaymentMethods
        });
      })
      .catch(error => {
        res.status(500).send({
          success: false,
          message: 'Server side error',
          error
        });
      })
});

module.exports = router;