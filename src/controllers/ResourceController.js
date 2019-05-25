const Token = require('../database/mongooseModels/Token')
const Currency = require('../database/mongooseModels/Currency')
const Country = require('../database/mongooseModels/Country')
const PaymentMethod = require('../database/mongooseModels/PaymentMethod')
const i18n = require('i18n');

module.exports.tokens = function (req, res, next) {
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
                message: i18n.__('sse'),
                error
            });
        })
};

module.exports.currencies = function (req, res, next) {
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
                message: i18n.__('sse'),
                error
            });
        })
};

module.exports.countries = function (req, res, next) {
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
                message: i18n.__('sse'),
                error
            });
        })
};

module.exports.paymentMethods = function (req, res, next) {
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
                message: i18n.__('sse'),
                error
            });
        })
};