const Advertisement = require('../database/mongooseModels/Advertisement');
const Token = require('../database/mongooseModels/Token');
const PaymentMethod = require('../database/mongooseModels/PaymentMethod');
const Currency = require('../database/mongooseModels/Currency');
const mongoose = require('mongoose');
let allTokens = [];
Token.find({}).then(tokens => {allTokens = tokens;});

const validateNewAdvertisement = (adv) => {
    let timeWindowRegx = /^\d+$/
    let errors = [];
    if(adv.type !== 'sell' && adv.type !== 'buy')
        errors.push('Invalid advertisement type. Type most be sell or buy.');
    if(!Token.validateCode(adv.token))
        errors.push('Invalid token');
    if(!PaymentMethod.validateMethod(adv.paymentMethod))
        errors.push('Invalid payment method');
    if(!Currency.validateCode(adv.currency))
        errors.push('Invalid currency');
    if(adv.amount == "" || parseFloat(adv.amount) <= 0)
        errors.push('Invalid amount');
    if(!adv.limitMin || parseFloat(adv.limitMin) <= 0)
        errors.push('Invalid limit min');
    if(!adv.limitMax || parseFloat(adv.limitMax) <= 0)
        errors.push('Invalid limit max');
    if(! /^\d{2}:\d{2}$/.test(adv.paymentWindow))
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

module.exports.publish = function (req, res, next) {
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
            return {enable: false, start: 0, end: 95};
        }
    })
    currentUser.getTokenBalance(advertisement.token.code)
        .then(({balance}) => {
            advertisement.filters = {
                token: advertisement.token.code,
                currency: advertisement.currency.code,
                ownerBrightIdScore: currentUser.brightIdScore,
                ownerFeedbackScore: currentUser.score,
                ownerBalance: advertisement.type === Advertisement.TYPE_SELL ? balance : 0
            };
            return new Advertisement(advertisement).save();
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
};
module.exports.edit = function (req, res, next) {
    let currentUser = req.data.user;
    let editId = req.body.id;
    let edit = req.body.advertisement;
    let advertisementToEdit = null;
    edit.user = currentUser;
    let errors = validateNewAdvertisement(edit);
    if (errors.length > 0) {
        return res.json({success: false, errors});
    }
    edit.token = Token.findByCode(edit.token);
    edit.currency = Currency.findByCode(edit.currency);
    edit.openingHours = edit.openingHours.map(item => {
        if(item.enable)
            return item;
        else {
            return {enable: false, start: 0, end: 95};
        }
    })
    Advertisement.findOne({_id: editId, user: currentUser._id})
        .then(adv => {
            if(!adv)
                throw {message: 'Advertisement not found.'};
            advertisementToEdit = adv;
            return currentUser.getTokenBalance(edit.token.code)
        })
        .then(({balance}) => {
            edit.filters = {
                token: edit.token.code,
                currency: edit.currency.code,
                ownerBrightIdScore: currentUser.brightIdScore,
                ownerFeedbackScore: currentUser.score,
                ownerBalance: edit.type === Advertisement.TYPE_SELL ? balance : 0
            };
            console.log('adv to edit: ', advertisementToEdit._id);
            return Advertisement.updateOne({
                _id: advertisementToEdit._id,
            },{deleted: true},{upsert: false});
        })
        .then(() => {
            edit.createdAt = advertisementToEdit.createdAt;
            return new Advertisement(edit).save();
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
};
module.exports.enable = function (req, res, next) {
    let currentUser = req.data.user;
    let id = req.body.id;
    let enable = req.body.enable;
    let advertisement = null;
    enable = enable === true || enable === 'true' || enable === 1;
    Advertisement.findOne({_id: id, user: currentUser._id})
        .then(adv => {
            advertisement = adv;
            advertisement.enable = enable;
            return advertisement.save();
        })
        .then(() => {
            res.send({
                success: true,
                advertisement
            });
        })
        .catch(error => {
            res.status(500).send({
                success: false,
                message: error.message || 'some error happens on document save',
                error
            })
        })
};
module.exports.delete = function (req, res, next) {
    let currentUser = req.data.user;
    let id = req.body.id;
    let advertisement = null;
    Advertisement.findOne({_id: id, user: currentUser._id})
        .then(adv => {
            advertisement = adv;
            advertisement.deleted = true;
            return advertisement.save();
        })
        .then(() => {
            res.send({
                success: true,
                advertisement
            });
        })
        .catch(error => {
            res.status(500).send({
                success: false,
                message: error.message || 'some error happens on document save',
                error
            })
        })
};
module.exports.list = function (req, res, next) {
    Advertisement.find({user: req.data.user._id, deleted:{$ne: true}})
        .populate('token')
        .populate('currency')
        .populate('paymentMethod')
        .sort({createdAt: -1})
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
}
module.exports.get = function (req, res, next) {
    Advertisement.findOne({_id: mongoose.Types.ObjectId(req.body.id)})
        .select('+filters')
        .populate('user')
        .populate('token')
        .populate('currency')
        .populate('paymentMethod')
        .then(advertisement => {
            if(advertisement.type === Advertisement.TYPE_SELL)
                advertisement.limitMax = Math.min(advertisement.limitMax, advertisement.filters.ownerBalance);
            advertisement.filters = undefined;
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
}
module.exports.testBind = function (req, res, next) {
    let advertisement = req.body.advertisement;
    res.send({
        success: true,
        advertisement
    });
}