const { Router } = require('express');
const Advertisement = require('../database/mongooseModels/Advertisement');
const {forceAuthorized} = require('../middleware/Authenticate');
const Token = require('../database/mongooseModels/Token');
const PaymentMethod = require('../database/mongooseModels/PaymentMethod');
const Currency = require('../database/mongooseModels/Currency');
const requireParam = require('../middleware/requestParamRequire');
const bind = require('../middleware/bindRequestToModel');
const mongoose = require('mongoose');
let router = Router();
let allTokens = [];
Token.find({}).then(tokens => {allTokens = tokens;});

const validateNewAdvertisement = async (adv) => {
  let timeWindowRegx = /^\d{2}:\d{2}$/;
  let errors = [];
  if(adv.type !== 'sell' && adv.type !== 'but')
    errors.push('Invalid advertisement type. Type most be sell or buy.');
  if(!Token.validateCode(adv.token))
    errors.push('Invalid token');
  if(!PaymentMethod.validateMethod(adv.paymentMethod))
    errors.push('Invalid payment method');
  if(!Currency.validateCode(adv.currency))
    errors.push('Invalid currency');
  if(adv.amount == "" || parseInt(adv.amount) <= 0)
    errors.push('Invalid amount');
  if(adv.limitMin == "" || parseInt(adv.limitMin) <= 0)
    errors.push('Invalid limit min');
  if(adv.limitMax == "" || parseInt(adv.limitMax) <= 0)
    errors.push('Invalid limit max');
  if(! timeWindowRegx.test(adv.paymentWindow))
    errors.push('Invalid payment window time');
  if(adv.openingHours.length != 7){
    errors.push('select opening hours for all days');
  }else{
    for(let i=0 ; i<7 ; i++){
      if(adv.openingHours[i].enable){
        if(! timeWindowRegx.test(adv.openingHours[i].start) || !timeWindowRegx.test(adv.openingHours[i].end))
          errors.push(`Incorrect opening hours for day [${i}]`);
      }
    }
  }
  if(typeof adv.terms !== 'string' || adv.terms.length <= 0)
    errors.push('Invalid terms of trade');

  return errors;
}

router.post('/new', forceAuthorized, requireParam('advertisement'), function (req, res, next) {
  let currentUser = req.data.user;
  let advertisement = req.body.advertisement;
  advertisement.user = req.data.user;
  let errors = validateNewAdvertisement(advertisement);
  if (errors.length > 0) {
    return res.json({success: false, errors});
  }
  advertisement.token = Token.findByCode(advertisement.token);
  advertisement.currency = Currency.findByCode(advertisement.currency);
  advertisement.openingHours = advertisement.openingHours.map(item => {
    if(item.enable)
      return item;
    else {
      return {enable: false, start: '00:00', end: '00:00'};
    }
  })
  currentUser.getTokenBalance(advertisement.token.code)
      .then(({balance}) => {
        advertisement.ownerBalanceEnough = advertisement.type === 'buy' || balance > advertisement.limitMax;
        advertisement.filters = {
          token: advertisement.token.code,
          currency: advertisement.currency.code,
          ownerBrightIdScore: currentUser.brightIdScore,
          ownerFeedbackScore: currentUser.score
        };
        return new Advertisement(advertisement).save()
      })
      .then(() => {
        res.send({
          success: true
        });
      })
      .catch(error => {
        res.status(500).send({
          success: false,
          message: error.message || 'some error happens on document save',
          error
        })
      })
});

router.get('/list', forceAuthorized, function (req, res, next) {
  Advertisement.find({user: req.data.user._id})
      .populate('token')
      .populate('currency')
      .populate('paymentMethod')
      .then(advertisements => {
        console.log('user advertisement count: '+ advertisements.length);
        res.send({
          success: true,
          advertisements
        })
      })
      .catch(error => res.status(500).send({
        success: false,
        message: error.message || 'server side error',
        error
      }))
})

router.all('/get', requireParam(['id:objectId']), function (req, res, next) {
  Advertisement.findOne({_id: mongoose.Types.ObjectId(req.body.id)})
      .populate('user')
      .populate('token')
      .populate('currency')
      .populate('paymentMethod')
      .then(advertisement => {
        res.send({
          success: true,
          advertisement,
          body: req.body
        })
      })
      .catch(error => res.status(500).send({
        success: false,
        message: error.message || 'server side error',
        error
      }))
})

router.post('/test-bind', bind('advertisement:Advertisement'), function (req, res, next) {
  let advertisement = req.body.advertisement;
  res.send({
    success: true,
    advertisement
  });
})

module.exports = router;