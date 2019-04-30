const { Router } = require('express');
const Token = require('../../database/mongooseModels/Token')
const Currency = require('../../database/mongooseModels/Currency')
const Country = require('../../database/mongooseModels/Country')
const Wallet = require('../../database/mongooseModels/Wallet')
const PaymentMethod = require('../../database/mongooseModels/PaymentMethod')
const requireParam = require('../../middleware/requestParamRequire');
const blockchane = require('../../blockchane');
let router = Router();

const initTokens = require('./init-tokens.json');
const initCurrencies = require('./init-currency.json');
const initCountries = require('./init-countries.json');
const initPaymentMethods = require('./init-payment-methods.json');
const nacl = require('tweetnacl');

const deployWalletScript = require('../../../scripts/deploy_wallet');

router.all('/tokens', function (req, res, next) {
  initTokens.map(token => {new Token(token).save();});
  res.send({
    success: true,
    message: 'feed successfully done.'
  })
});

router.all('/resources', function (req, res, next) {
  initCountries.map(country => {new Country(country).save();});
  initPaymentMethods.map(method => {new PaymentMethod(method).save();});
  initCurrencies.map(c => {
    if(!c.title)
      c.title = c.code;
    new Currency(c).save();
  });
  res.send({
    success: true,
    message: 'feed successfully done.'
  })
});

router.get('/deploy-wallet', function (req, res, next) {
    deployWalletScript.run(function (address) {
        new Wallet({address}).save().then(()=>{
          res.send({success: true, address});
        });
    })
})

module.exports = router;