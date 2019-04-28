const { Router } = require('express');
const Token = require('../../database/mongooseModels/Token')
const Currency = require('../../database/mongooseModels/Currency')
const Country = require('../../database/mongooseModels/Country')
const Wallet = require('../../database/mongooseModels/Wallet')
const PaymentMethod = require('../../database/mongooseModels/PaymentMethod')
const requireParam = require('../../middleware/requestParamRequire');
let router = Router();

const initTokens = require('./init-tokens.json');
const initCurrencies = require('./init-currency.json');
const initCountries = require('./init-countries.json');
const initPaymentMethods = require('./init-payment-methods.json');
const nacl = require('tweetnacl');

router.all('/', function (req, res, next) {
  initTokens.map(token => {new Token(token).save();});
  initCountries.map(country => {new Country(country).save();});
  initPaymentMethods.map(method => {new PaymentMethod(method).save();});
  // initialize new 20 test wallets;
  new Array(20).fill(0)
      .map(n => nacl.sign.keyPair())
      .map(keyPair => ({
        publicKey: "0x"+Buffer.from(keyPair.publicKey).toString('hex'),
        secretKey: "0x"+Buffer.from(keyPair.secretKey).toString('hex'),
      }))
      .map(keyPair => {(new Wallet(keyPair)).save();});
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

module.exports = router;