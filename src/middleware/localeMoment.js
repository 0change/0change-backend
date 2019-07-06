var moment = require('moment');
const i18n = require('i18n');

module.exports = function (req, res, next) {
    let locale = req.headers["locale"];
    if(!req.data)
        req.data = {};
    if(locale) {
        req.data.locale = locale;
        /**
         * changing moment local, causes error
         * because moment is used in many place to store data to db or comparison of two dates.
         */
        // moment.locale(locale);
        i18n.setLocale(/*req,*/locale);
    }else{
        req.data.locale = 'en';
        i18n.setLocale(/*req,*/'en');
    }
    next();
}