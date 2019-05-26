const { Router } = require('express');
const Token = require('../../database/mongooseModels/Token')
const Currency = require('../../database/mongooseModels/Currency')
const Country = require('../../database/mongooseModels/Country')
const Wallet = require('../../database/mongooseModels/Wallet')
const PaymentMethod = require('../../database/mongooseModels/PaymentMethod')
const requireParam = require('../../middleware/requestParamRequire');
const blockchain = require('../../blockchain');
let router = Router();

const initTokens = require('./init-tokens.js');
const initCurrencies = require('./init-currency.js');
const initCountries = require('./init-countries.json');
const initPaymentMethods = require('./init-payment-methods.json');
const nacl = require('tweetnacl');

const deployWalletScript = require('../../../scripts/deploy_wallet');

router.all('/tokens', function (req, res, next) {
  initTokens
      .filter(item => item.network === process.env.BLOCKCHAIN_NETWORK)
      .map(token => {new Token(token).save();});
  res.send({
    success: true,
    message: 'feed successfully done.'
  })
});

router.all('/resources', function (req, res, next) {
  // initCountries.map(country => {new Country(country).save();});
  // initPaymentMethods.map(method => {new PaymentMethod(method).save();});
  // initialize new 20 test wallets;
  // if(process.env.SEED_REGULAR_WALLET) {
  //     new Array(200).fill(0)
  //         .map(n => blockchain.createWallet())
  //         .map(wallet => ({
  //             assigned: false,
  //             address: wallet.address,
  //             privateKey: wallet.privateKey
  //         }))
  //         .map(keyPair => {
  //             (new Wallet(keyPair)).save();
  //         });
  // }
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
    Wallet.find({assigned: false})
        .then(wallets => {
            if(wallets.length < process.env.MIN_FREE_WALLET_COUNT){
                deployWalletScript.run(function (address) {
                    new Wallet({address}).save().then(()=>{
                        res.send({success: true, address});
                    })
                        .catch(error => res.send({
                            success: false,
                            error
                        }));
                })
            }else{
                res.send({success: true, message: 'Wallet count is enough now.'})
            }
        }).catch(error => {
            res.send({
                success: false,
                error
            })
    })
})

module.exports = router;