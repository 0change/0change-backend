const Trade = require('../database/mongooseModels/Trade');
const TradeMessage = require('../database/mongooseModels/TradeMessage');
const Feedback = require('../database/mongooseModels/Feedback');
const Transaction = require('../database/mongooseModels/Transaction');
const Advertisement = require('../database/mongooseModels/Advertisement');
const NotificationHandler = require('../NotificationHandler');
const moveFile = require('../utils/moveFile');
const idToDirectory = require('../utils/idToDirectory');
const ensureDirExist = require('../utils/ensureDirExist');
const randomString = require("../utils/randomString");
const moment = require('moment');
const path = require('path');

const TRADE_EVENT_REQUEST = 'TRADE_EVENT_MESSAGE_REQUEST';
const TRADE_EVENT_START = 'TRADE_EVENT_MESSAGE_START';
const TRADE_EVENT_PAID = 'TRADE_EVENT_MESSAGE_PAID';
const TRADE_EVENT_RELEASED = 'TRADE_EVENT_MESSAGE_RELEASED';
const TRADE_EVENT_CANCELED = 'TRADE_EVENT_MESSAGE_CANCELED';
const TRADE_EVENT_DISPUTED = 'TRADE_EVENT_MESSAGE_DISPUTED';
const TRADE_EVENT_PAYMENT_WINDOW_TIMEOUT = 'TRADE_EVENT_MESSAGE_PAYMENT_WINDOW_TIMEOUT ';

function checkSellerBalance(adv, user, tradeTokenCount) {
    return new Promise(function (resolve, reject) {
        if (adv.type === Advertisement.TYPE_SELL) {
            adv.user.getTokenBalance(adv.token.code)
                .then(({balance}) => {
                    if (balance < tradeTokenCount)
                        reject({message: "Advertisement owner doesn't have enough balance. Search again and try another one."});
                    else
                        resolve(true);
                })
                .catch(reject);
        } else {
            user.getTokenBalance(adv.token.code)
                .then(({balance}) => {
                    if (balance < tradeTokenCount) {
                        console.log(`User doesn't have enough token. token: ${adv.token.code} user balance: ${balance} - trade token count: ${tradeTokenCount}`);
                        reject({message: `You don't enough balance. Make deposit and try again.`});
                    } else
                        resolve(true);
                })
                .catch(err => {
                    reject({message: err.message || 'Server side error.', error: err});
                })
        }
        // TODO: Buy advertisement balance not checked
    })
}

/**
 * Sample request content
 *
 * request body [req.body]:
 * {
 *      tradeId: '5cc2a3f741b2db0c9495e219',
 *      message: '123'
 * }
 * request files [req.files]:
 * [
 *    {
 *       fieldname: 'attachments[]',
 *       originalname: 'star.png',
 *       encoding: '7bit',
 *       mimetype: 'image/png',
 *       destination: 'uploads_temp_dir/',
 *       filename: '18e1669cfa6fc5740535303feef82a6d',
 *       path: 'uploads_temp_dir/18e1669cfa6fc5740535303feef82a6d',
 *       size: 25034
 *    },
 *    {
 *       fieldname: 'attachments[]',
 *       originalname: 'Screenshot from 2019-04-25 14-18-02.png',
 *       encoding: '7bit',
 *       mimetype: 'image/png',
 *       destination: 'uploads_temp_dir/',
 *       filename: 'c802d2e3350cc99a660846b1e19c94d8',
 *       path: 'uploads_temp_dir/c802d2e3350cc99a660846b1e19c94d8',
 *       size: 156863
 *    }
 * ]

 */
function uploadedFileNewName(uploadedFile) {
    let name = uploadedFile.filename + path.extname(uploadedFile.originalname);
    return name;
}

function sendTradeEventMessage(trade, message) {
    let newMessage = new TradeMessage({
        trade,
        type: TradeMessage.TYPE_EVENT,
        content: message
    });
    return newMessage.save();
}

function checkTradeParties(trade, currentUser) {
    if (
        (currentUser._id.toString() !== trade.user._id.toString())
        && (currentUser._id.toString() !== trade.advertisementOwner._id.toString())
        && !currentUser.hasPermissions(['operator'])
    ) throw {message: "Access denied"};
}

function isOperator(trade, currentUser) {
    if (
        (currentUser._id.toString() !== trade.user._id.toString())
        && (currentUser._id.toString() !== trade.advertisementOwner._id.toString())
        && currentUser.hasPermissions(['operator'])
    ) return true;
    return false;
}

module.exports.search = function (req, res, next) {
    let aggregate = [];
    let filters = req.body.filters || {};
    console.log('user filters: ', filters);
    let skip = parseInt(req.body.skip) || 0;
    let limit = parseInt(req.body.limit) || 20;
    let query = {enable: true, deleted: {$ne: true}};
    // let checkAmountQuery = {};
    // if (filters.amount && parseFloat(filters.amount) > 0) {
    //     let amount = parseFloat(filters.amount);
    //     checkAmountQuery = {
    //         $and: [
    //             {limitMin: {$lte: amount}},
    //             {limitMax: {$gte: amount}},
    //         ]
    //     }
    // }
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
    if (filters.token) {
        query['filters.token'] = filters.token;
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
    Advertisement.find(query)
        .limit(limit)
        .populate('user')
        .populate('token')
        .populate('currency')
        .then(advertisements => {
            res.send({
                success: true,
                advertisements
            })
        })
        .catch(error => {
            res.status(500).send({
                success: false,
                message: error.message || 'some error happens on search',
                error
            })
        })
}
module.exports.userTradesList = function (req, res, next) {
    let currentUser = req.data.user;
    let query = {
        $or: [
            {user: currentUser._id},
            {advertisementOwner: currentUser._id},
        ]
    };
    if (req.body.status)
        query.status = req.body.status;

    Trade.find(query)
        .populate({path: 'advertisement', populate: {path: 'token'}})
        .populate('user')
        .populate('advertisementOwner')
        .sort({createdAt: -1})
        .then(trades => {
            res.send({
                success: true,
                trades
            })
        })
        .catch(error => {
            res.status(500).send({
                success: false,
                message: error.message || 'Server side error',
                error
            });
        })
}
module.exports.createTrade = function (req, res, next) {
    let currentUser = req.data.user;
    let message = req.body.message || "";
    // message.push({sender: currentUser, type: Trade.MESSAGE_TYPE_TEXT, content: "user request to start trade"});
    let count = req.body.count;
    let advertisement = null;
    let newTrade = null;
    Advertisement.findOne({_id: req.body.advertisementId})
        .populate('user')
        .populate('token')
        .then(adv => {
            advertisement = adv;
            if (adv.user._id.toString() === currentUser._id.toString())
                throw {message: 'Users cannot trade with themselves.'};
            return checkSellerBalance(adv, currentUser, count);
        })
        .then(() => {
            let tradeData = {
                user: currentUser,
                advertisementOwner: advertisement.user,
                advertisement: advertisement,
                tokenCount: count,
                status: Trade.STATUS_REQUEST
            };
            return new Trade(tradeData);
        })
        .then(trade => {
            newTrade = trade;
            return trade.save()
        })
        .then(() => {
            if (newTrade.user._id.toString() === currentUser._id.toString()) {
                NotificationHandler.notifyUser(
                    newTrade.advertisement.user,
                    'New Trade request.',
                    [{type: 'trade-open', params: {id: newTrade._id}}]
                );
            } else {
                NotificationHandler.notifyUser(
                    newTrade.user,
                    'New trade request.',
                    [{type: 'trade-open', params: {id: newTrade._id}}]
                );
            }
            if (message) {
                return new TradeMessage({
                    trade: newTrade._id,
                    type: TradeMessage.TYPE_MESSAGE,
                    content: message,
                    sender: currentUser
                }).save();
            }
        })
        .then(() => {
            res.send({
                success: true,
                tradeId: newTrade._id
            })
        })
        .catch(error => {
            res.status(500).send({
                success: false,
                message: error.message || 'Server side error',
                error
            });
        })
}
module.exports.message = function (req, res, next) {
    let currentUser = req.data.user;
    let content = req.body.message;
    let trade = null;
    let fileUploadDirectory = null;
    let attachments = [];
    Trade.findOne({_id: req.body.tradeId})
        .populate('user')
        .populate('disputeOperator')
        .populate({path: 'advertisement', populate: [{path: 'user'}, {path: 'token'}]})
        .then(trd => {
            if (!trd)
                throw ({message: "Cannot find the trade."});
            trade = trd;
            checkTradeParties(trade, currentUser);
            if (req.files && req.files.length > 0) {
                fileUploadDirectory = '/uploads' + idToDirectory(trade._id, "trade");
                return ensureDirExist(path.resolve(__dirname + "/../../" + fileUploadDirectory));
            }
        })
        .then(() => {
            if (req.files && req.files.length > 0) {
                attachments = req.files.map(f => (fileUploadDirectory + uploadedFileNewName(f)));
                let movements = req.files.map(f => moveFile(
                    path.resolve(__dirname + "/" + `../../${f.path}`),
                    path.resolve(__dirname + "/../../" + fileUploadDirectory + uploadedFileNewName(f))
                ))
                return Promise.all(movements);
            }
        })
        .then(() => {
            // trade.messages.push({sender: req.data.user, type, content});
            if (isOperator(trade, currentUser)) {
                trade.disputeOperator = currentUser;
                Trade.updateOne({_id: trade._id}, {$set: {disputeOperator: currentUser._id}}, {upsert: false}, () => {
                })
            }
            let tradeMessage = new TradeMessage({
                trade,
                type: TradeMessage.TYPE_MESSAGE,
                sender: req.data.user,
                attachments,
                content
            });
            return tradeMessage.save();
        })
        .then(() => TradeMessage.find({trade: trade._id}))
        .then(messages => {
            if (currentUser._id.toString() !== trade.advertisement.user._id.toString()) {
                NotificationHandler.notifyUser(
                    trade.advertisement.user,
                    'New message ...',
                    [{type: 'trade-open', params: {id: trade._id}}]
                );
            }
            if (currentUser._id.toString() !== trade.user._id.toString()) {
                NotificationHandler.notifyUser(
                    trade.user,
                    'New message ...',
                    [{type: 'trade-open', params: {id: trade._id}}]
                );
            }
            if (trade.disputeOperator && currentUser._id.toString() !== trade.disputeOperator._id.toString()) {
                NotificationHandler.notifyUser(
                    trade.disputeOperator,
                    'Disputed trades message ...',
                    [{type: 'trade-open', params: {id: trade._id}}]
                );
            }
            NotificationHandler.tradeChat(trade, currentUser, content);
            res.send({
                success: true,
                messages,
            })
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: error.message || 'server side error',
                error
            })
        })
}
module.exports.getInfo = function (req, res, next) {
    let trade = null;
    let currentUser = req.data.user;
    Trade.findOne({_id: req.body.id})
        .populate('user')
        .populate({path: 'advertisement', populate: {path: 'user'}})
        .populate('messages')
        .populate('canceledBy')
        .populate('disputedBy')
        .populate({path: 'messages.sender', model: 'user'})
        .then(_trade => {
            checkTradeParties(_trade, currentUser);
            trade = _trade;
            return Feedback.findOne({
                sender: currentUser._id,
                trade: _trade._id
            });
        })
        .then(feedback => {
            res.send({
                success: true,
                trade,
                feedback
            })
        })
        .catch(error => {
            console.log(error.message);
            res.status(500).send({
                success: false,
                message: error.message || 'server side error',
                error
            })
        })
}
module.exports.start = function (req, res, next) {
    let currentUser = req.data.user;
    let trade = null;
    Trade.findOne({_id: req.body.id})
        .populate('user')
        .populate({path: 'advertisement', populate: [{path: 'user'}, {path: 'token'}]})
        .populate('messages')
        .populate({path: 'messages.sender', model: 'user'})
        .then(trd => {
            trade = trd;
            if (trade.status !== Trade.STATUS_REQUEST)
                throw {message: "Invalid trade status. Only a requested trade can be started."};
            if (currentUser._id.toString() !== trade.advertisementOwner.toString())
                throw {message: "Access denied. Only advertisement owner can start a trade"};
            return checkSellerBalance(trade.advertisement, currentUser, trade.tokenCount);
        })
        .then(() => {
            trade.status = Trade.STATUS_START;
            trade.startTime = Date.now();
            let timeWindow = trade.advertisement.paymentWindow.split(':');
            trade.paymentExpiration = moment().add(timeWindow[0], 'hours').add(timeWindow[1], 'minutes').format('YYYY-MM-DD HH:mm');
            if (trade.user._id.toString() === currentUser._id.toString()) {
                NotificationHandler.notifyUser(
                    trade.advertisement.user,
                    'Your trade does started.',
                    [{type: 'trade-open', params: {id: trade._id}}]
                );
            } else {
                NotificationHandler.notifyUser(
                    trade.user,
                    'Your trade does started.',
                    [{type: 'trade-open', params: {id: trade._id}}]
                );
            }
            sendTradeEventMessage(trade, TRADE_EVENT_START);
            NotificationHandler.tradeStateChanged(trade, Trade.STATUS_START);
            return trade.save();
        })
        .then(() => {
            return new Transaction({
                trade: trade._id,
                count: trade.tokenCount,
                token: trade.advertisement.token.code,
                status: Transaction.STATUS_NEW,
                txHash: '0x' + randomString(64, '0123456789abcdef'),
                from: trade.advertisement.type === 'sell' ? currentUser.address : trade.user.address,
                to: trade.advertisement.type === 'sell' ? trade.user.address : currentUser.address,
                txTime: Date.now(),
            }).save();
        })
        .then(() => {
            res.send({
                success: true,
                trade,
            })
        })
        .catch(error => {
            console.log(error.message);
            // TODO: document modification
            res.status(500).send({
                success: false,
                message: error.message || 'server side error',
                error
            })
        })
}
module.exports.setPaid = function (req, res, next) {
    let currentUser = req.data.user;
    let trade = null;
    Trade.findOne({_id: req.body.id})
        .populate('user')
        .populate({path: 'advertisement', populate: [{path: 'user'}, {path: 'token'}]})
        .populate('messages')
        .populate({path: 'messages.sender', model: 'user'})
        .then(trd => {
            trade = trd;
            if (trade.status !== Trade.STATUS_START)
                throw {message: "Invalid trade status. Only a started trade can be paid."};
            if (trade.advertisement.type === 'sell' && currentUser._id.toString() !== trade.user._id.toString())
                throw {message: "Access denied. Only the trade owner can set the trade to paid"};
            if (trade.advertisement.type === 'buy' && currentUser._id.toString() !== trade.advertisement.user._id.toString())
                throw {message: "Access denied. only the advertisement owner can set the trade to paid"};
            trade.status = Trade.STATUS_PAYMENT;
            trade.paymentTime = Date.now();
            // trade.messages.push({
            //   sender: currentUser,
            //   type:Trade.MESSAGE_TYPE_TEXT,
            //   content: 'Owner accept and start the trade'
            // });
            sendTradeEventMessage(trade, TRADE_EVENT_PAID);
            NotificationHandler.tradeStateChanged(trade, Trade.STATUS_PAYMENT);
            return trade.save();
        })
        .then(() => {
            if (trade.user._id.toString() === currentUser._id.toString()) {
                NotificationHandler.notifyUser(
                    trade.advertisement.user,
                    'You Trade has been paid.',
                    [{type: 'trade-open', params: {id: trade._id}}]
                );
            } else {
                NotificationHandler.notifyUser(
                    trade.user,
                    'You Trade has been paid.',
                    [{type: 'trade-open', params: {id: trade._id}}]
                );
            }
            res.send({
                success: true,
                trade,
            })
        })
        .catch(error => {
            console.log(error.message);
            res.status(500).send({
                success: false,
                message: error.message || 'server side error',
                error
            })
        })
}
module.exports.release = function (req, res, next) {
    let currentUser = req.data.user;
    let trade = null;
    Trade.findOne({_id: req.body.id})
        .populate('user')
        .populate({path: 'advertisement', populate: [{path: 'user'}, {path: 'token'}]})
        .populate('messages')
        .populate({path: 'messages.sender', model: 'user'})
        .then(trd => {
            trade = trd;
            checkTradeParties(trade, currentUser);
            if (trade.status !== Trade.STATUS_PAYMENT && trade.status !== Trade.STATUS_DISPUTE)
                throw {message: "Invalid trade status. only a paid/disputed trade, can release."};
            if (trade.advertisement.type === 'sell' && currentUser._id.toString() === trade.user._id.toString()) {
                throw {message: "Access denied. Buyer can not release the tokens"};
            }
            if (trade.advertisement.type === 'buy' && currentUser._id.toString() === trade.advertisement.user._id.toString()) {
                throw {message: "Access denied. Buyer can not release tokens"};
            }
            trade.status = Trade.STATUS_RELEASE;
            sendTradeEventMessage(trade, TRADE_EVENT_RELEASED);
            NotificationHandler.tradeStateChanged(trade, Trade.STATUS_RELEASE);
            // trade.messages.push({
            //   sender: currentUser,
            //   type:Trade.MESSAGE_TYPE_TEXT,
            //   content: 'Owner accept and start the trade'
            // });
            return trade.save();
        })
        .then(() => {
            return Transaction.updateOne({trade: trade._id}, {status: Transaction.STATUS_DONE});
        })
        .then(() => {
            if (trade.user._id.toString() === currentUser._id.toString()) {
                NotificationHandler.notifyUser(
                    trade.advertisement.user,
                    'Your trade tokens has been released.',
                    [{type: 'trade-open', params: {id: trade._id}}]
                );
            } else {
                NotificationHandler.notifyUser(
                    trade.user,
                    'Your trade tokens has been released.',
                    [{type: 'trade-open', params: {id: trade._id}}]
                );
            }
            res.send({
                success: true,
                trade,
            })
        })
        .catch(error => {
            console.log(error.message);
            res.status(500).send({
                success: false,
                message: error.message || 'server side error',
                error
            })
        })
}
module.exports.cancel = function (req, res, next) {
    let currentUser = req.data.user;
    let trade = null;
    Trade.findOne({_id: req.body.id})
        .populate('user')
        .populate({path: 'advertisement', populate: [{path: 'user'}, {path: 'token'}]})
        .populate('messages')
        .populate({path: 'messages.sender', model: 'user'})
        .then(trd => {
            trade = trd;
            if (
                trade.status !== Trade.STATUS_REQUEST
                && trade.status !== Trade.STATUS_START
                && trade.status !== Trade.STATUS_PAYMENT
                && trade.status !== Trade.STATUS_DISPUTE
            ) {
                throw {message: "Invalid trade status. Only a requested/started/paid/disputed trades, can be canceled."};
            }
            checkTradeParties(trade, currentUser);
            if (trade.status !== 'request') {
                if (trade.advertisement.type === 'sell' && currentUser._id.toString() === trade.advertisement.user._id.toString()) {
                    throw {message: "Access denied. Seller can not cancel the trade"};
                }
                if (trade.advertisement.type === 'buy' && currentUser._id.toString() === trade.user._id.toString()) {
                    throw {message: "Access denied. Seller can not cancel the trade"};
                }
            }
            trade.canceledBy = currentUser;
            trade.status = Trade.STATUS_CANCEL;
            // trade.messages.push({
            //   sender: currentUser,
            //   type:Trade.MESSAGE_TYPE_TEXT,
            //   content: 'Owner accept and start the trade'
            // });
            sendTradeEventMessage(trade, TRADE_EVENT_CANCELED);
            NotificationHandler.tradeStateChanged(trade, Trade.STATUS_CANCEL);
            return trade.save();
        })
        .then(() => {
            if (trade.user._id.toString() === currentUser._id.toString()) {
                NotificationHandler.notifyUser(
                    trade.advertisement.user,
                    'Your Trade has been canceled by trader.',
                    [{type: 'trade-open', params: {id: trade._id}}]
                );
            } else {
                NotificationHandler.notifyUser(
                    trade.user,
                    'Your trade has been canceled by trader.',
                    [{type: 'trade-open', params: {id: trade._id}}]
                );
            }
            return Transaction.updateOne(
                {
                    trade: trade._id
                },
                {
                    status: Transaction.STATUS_CANCEL
                }
            )
        })
        .then(() => {
            res.send({
                success: true,
                trade,
            })
        })
        .catch(error => {
            console.log(error.message);
            res.status(500).send({
                success: false,
                message: error.message || 'server side error',
                error
            })
        })
}
module.exports.dispute = function (req, res, next) {
    let currentUser = req.data.user;
    let message = req.body.message;
    let trade = null;
    Trade.findOne({_id: req.body.id})
        .populate('user')
        .populate({path: 'advertisement', populate: [{path: 'user'}, {path: 'token'}]})
        .populate('messages')
        .populate({path: 'messages.sender', model: 'user'})
        .then(trd => {
            trade = trd;
            if (trade.status !== Trade.STATUS_PAYMENT)
                throw {message: "Invalid trade status. Only a paid trade, can be disputed."};
            if (trade.advertisement.type === 'sell' && currentUser._id.toString() !== trade.user._id.toString())
                throw {message: "Access denied. Only the trade creator can dispute"};
            if (trade.advertisement.type === 'buy' && currentUser._id.toString() !== trade.advertisement.user._id.toString())
                throw {message: "Access denied. Only the advertisement owner can dispute"};

            trade.disputedBy = currentUser;
            trade.status = Trade.STATUS_DISPUTE;
            // trade.messages.push({
            //   sender: currentUser,
            //   type:Trade.MESSAGE_TYPE_TEXT,
            //   content: 'Owner accept and start the trade'
            // });
            sendTradeEventMessage(trade, TRADE_EVENT_DISPUTED);
            NotificationHandler.tradeStateChanged(trade, Trade.STATUS_DISPUTE);
            return trade.save();
        })
        .then(() => {
            if (message) {
                return new TradeMessage({
                    trade: trade._id,
                    type: TradeMessage.TYPE_MESSAGE,
                    content: message,
                    sender: currentUser
                }).save();
            }
        })
        .then(() => {
            res.send({
                success: true,
                trade,
            })
        })
        .catch(error => {
            console.log(error.message);
            res.status(500).send({
                success: false,
                message: error.message || 'server side error',
                error
            })
        })
}
module.exports.postFeedback = function (req, res, next) {
    let currentUser = req.data.user;
    let trade = null;
    let star = req.body.star;
    if (star < 1 || star > 5)
        return {success: false, message: "invalid feedback star"};
    let comment = req.body.comment || "";
    Trade.findOne({_id: req.body.tradeId})
        .then(trd => {
            if (!trd)
                throw {message: 'Invalid tradeId.'}
            trade = trd;
            if (trade.status === Trade.STATUS_REQUEST)
                throw {message: "Invalid trade status."};
            return Feedback.findOne({
                sender: currentUser._id,
                trade: trade._id
            });
        })
        .then(feedback => {
            let sender = currentUser._id;
            let reciever = currentUser._id.toString() === trade.user.toString() ? trade.advertisementOwner : trade.user;
            if (feedback) {
                feedback.star = star;
                feedback.comment = comment;
                return feedback.save();
            } else {
                return new Feedback({
                    sender,
                    user: reciever,
                    trade: trade._id,
                    star,
                    comment
                }).save();
            }
        })
        .then(() => {
            res.send({
                success: true
            })
        })
        .catch(error => {
            res.status(500).send({
                success: false,
                message: error.message || 'server side error',
                error
            })
        })
}