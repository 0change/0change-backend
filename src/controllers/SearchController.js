const Advertisement = require('../database/mongooseModels/Advertisement');
const Search = require('../database/mongooseModels/Search');
const i18n = require('i18n');

module.exports.search = function (req, res, next) {
    let filters = req.body.query || {};
    // console.log('user filters: ', filters);
    let skip = parseInt(req.body.skip) || 0;
    let limit = parseInt(req.body.limit) || 20;
    let query = {enable: true, deleted: {$ne: true}};
    if (filters.type && (filters.type === Advertisement.TYPE_SELL || filters.type === Advertisement.TYPE_BUY)) {
        query.type = filters.type;
        if (filters.type === Advertisement.TYPE_SELL) {
            query['$where'] = "this.filters.ownerBalance >= this.limitMin";
        }
    } else {
        query['$or'] = [
            {type: Advertisement.TYPE_BUY},
            {
                '$and': [
                    {type: Advertisement.TYPE_SELL},
                    {$where: "this.filters.ownerBalance >= this.limitMin"}
                ]
            }
        ]
    }
    if (filters.amount && parseFloat(filters.amount) > 0) {
        let amount = parseFloat(filters.amount);
        query['limitMin'] = {$lt: amount};
        query['limitMax'] = {$gt: amount};
        query['filters.ownerBalance'] = {$gt: amount};
    }
    if (filters.token) {
        query['filters.token'] = filters.token;
    }
    if (!!filters.paymentMethod) {
        query['paymentMethod'] = filters.paymentMethod;
    }
    if (filters.feedback && parseFloat(filters.feedback) > 0 && parseFloat(filters.feedback) <= 5) {
        query['filters.ownerFeedbackScore'] = parseFloat(filters.feedback);
    }
    else if (filters.tokens && Array.isArray(filters.tokens) && filters.tokens.length > 0) {
        query['filters.token'] = {$in: filters.tokens};
    }
    if (filters.currency) {
        query['filters.currency'] = filters.currency;
    }
    else if (filters.currencies && Array.isArray(filters.currencies) && filters.currencies.length > 0) {
        query['filters.currency'] = {$in: filters.currencies};
    }
    if (!!filters.brightid && parseFloat(filters.brightid) > 0) {
        query['filters.ownerBrightIdScore'] = {$gte: filters.brightid}
    }
    if (!!filters.feedback && parseFloat(filters.feedback) > 0) {
        query['filters.ownerFeedbackScore'] = {$gte: filters.feedback}
    }
    console.log('query: ', query);
    Advertisement.find(query,{_id:1, amount: 1})
        .sort({amount: 1})
        .then(advertisements => {
            let search = new Search({
                query: req.body.query,
                filters: {},
                results: advertisements.map(offer => offer._id),
                count: advertisements.length
            });
            search.save();
            res.send({
                success: true,
                count: search.count,
                searchId: search._id
            })
        })
        .catch(error => {
            res.status(500).send({
                success: false,
                message: error.message || i18n.__('sse'),
                error
            })
        })
}

module.exports.result = function (req, res, next) {
    let search = req.body.search;
    let page = req.body.page || 0;
    let itemPerPage = req.body.itemPerPage || 20;
    let start = page*itemPerPage;
    let end = start + itemPerPage;
    let resultIds = search.results.slice(start, end);
    Advertisement.find({_id: {$in: resultIds}})
        .select('+filters')
        .populate('user')
        .populate('token')
        .populate('currency')
        .then(results => {
            results.map(adv => {
                if (adv.type === Advertisement.TYPE_SELL)
                    adv.limitMax = Math.min(adv.limitMax, adv.filters.ownerBalance);
                adv.filters = undefined;
            });
            // re arrange in order to resultId items orders
            let arrangedResult = [];
            resultIds.map(id => {
                let item = results.find(r => r._id.toString() == id.toString());
                if(item)
                    arrangedResult.push(item);
            })
            res.send({
                success: true,
                page,
                itemPerPage,
                results: arrangedResult,
                body: req.body
            })
        })
        .catch(error => {
            res.send({
                success: false,
                message: error.message || i18n.__('sse'),
                error
            })
        })
}