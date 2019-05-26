const User = require('../database/mongooseModels/User');
const Token = require('../database/mongooseModels/Token');
const Trade = require('../database/mongooseModels/Trade');
const TradeMessage = require('../database/mongooseModels/TradeMessage');
const Transaction = require('../database/mongooseModels/Transaction');
const Feedback = require('../database/mongooseModels/Feedback');
const blockchain = require('../blockchain');
const web3 = require('../../scripts/web3-object');
const EventBus = require('../eventBus');
const i18n = require('i18n');

function checkUsernameAvailable(username) {
    if (username.length < 6) {
        return Promise.reject({message: i18n.__('api.user.usernameAtLEast6')});
    }
    return User.findOne({username: new RegExp(`^${username}$`, "i")})
        .then(user => {
            if (user)
                throw {message: i18n.__('api.user.usernameTaken')}
        })
}

function checkEmailAvailable(email) {
    return User.findOne({email: new RegExp(`^${email}$`, "i")})
        .then(user => {
            if (user)
                throw {message: i18n.__('api.user.emailTaken')}
        })
}

module.exports.getInfo =  function (req, res, next) {
    let userId = req.body.userId;
    let user = null;
    let userInfoPromise = null;
    if (!userId) {
        userInfoPromise = Promise.resolve(req.data.user);
    } else {
        userInfoPromise = User.findOne({_id: userId});
    }
    userInfoPromise
        .then(_user => {
            user = _user;
            if (req.body.feedback) {
                return Feedback.find({user: user._id})
            } else {
                return null;
            }
        })
        .then(feedbacks => {
            let response = {
                success: true,
                user
            };
            if (req.body.feedback)
                response.feedbacks = feedbacks;
            res.json(response);
        })
        .catch(error => {
            res.status(500).json({
                success: false,
                message: error.message || i18n.__('sse'),
                error
            });
        })
};

module.exports.checkDeposit = function (req, res, next) {
    let user = req.data.user;
    let transactions = [];
    let newCount = 0;
    let allTokens = Token.getList();
    let contractAddresses = allTokens.map(t => t.contractAddress);
    let allPromise = contractAddresses.map(contractAddress => blockchain.monitorWallet(user.address, contractAddress, process.env.BLOCKCHAIN_START_BLOCK_NUMBER))
    Promise.all(allPromise)
        .then(responses => {
            let txs = {};
            for (let i = 0; i < responses.length; i++) {
                if (responses[i].events.length > 0) {
                    txs[allTokens[i].code] = [];
                    responses[i].events.map(e => {
                        // let bn = web3.utils.toBN(e.value._hex);
                        e.count = web3.utils.fromWei(e.value._hex, 'ether');
                        txs[allTokens[i].code].push(e);
                    })
                }
            }
            return txs;
        })
        .then(txs => {
            transactions = txs;
            let txToSave = [];
            Object.keys(transactions).map(key => {
                transactions[key].map(tx => {
                    txToSave.push(
                        Transaction.findOne({txHash: tx.tx_hash})
                            .then(tx0 => {
                                if (!tx0 && tx.count) {
                                    newCount++;
                                    return new Transaction({
                                        status: Transaction.STATUS_DONE,
                                        txHash: tx.tx_hash,
                                        from: tx.from,
                                        to: tx.to,
                                        token: key,
                                        txTime: Date.now(),
                                        count: tx.count,
                                        info: tx
                                    }).save();
                                }
                            })
                    )
                })
            })
            return Promise.all(txToSave);
        })
        .then(() => {
            res.send({
                success: true,
                newTransaction: newCount,
                transactions
            });
            EventBus.emit(EventBus.EVENT_USER_BALANCE_NEED_TO_UPDATE, user);
        })
        .catch(error => {
            console.log(error);
            res.send({success: false, error})
        });
};

module.exports.checkUsername = function (req, res, next) {
    let username = req.body.username;
    checkUsernameAvailable(username)
        .then(() => {
            res.send({
                success: true,
                message: i18n.__('api.user.usernameAvailable')
            })
        })
        .catch(error => {
            res.send({
                success: false,
                message: error.message || i18n.__('sse'),
                error: error
            })
        })
}

module.exports.updateUsername = function (req, res, next) {
    let username = req.body.username;
    checkUsernameAvailable(username)
        .then(() => {
            let user = req.data.user;
            user.username = username;
            return user.save();
        })
        .then(() => {
            res.send({
                success: true,
                message: i18n.__('api.user.usernameUpdateSuccess')
            })
        })
        .catch(error => {
            res.send({
                success: false,
                message: error.message || i18n.__('sse'),
                error: error
            })
        })
}

module.exports.checkEmail = function (req, res, next) {
    let email = req.body.email;
    checkEmailAvailable(email)
        .then(() => {
            res.send({
                success: true,
                message: i18n.__('api.user.emailNotTaken')
            })
        })
        .catch(error => {
            res.send({
                success: false,
                message: error.message || i18n.__('sse'),
                error: error
            })
        })
}

module.exports.updateEmail = function (req, res, next) {
    let email = req.body.email;
    checkEmailAvailable(email)
        .then(() => {
            let user = req.data.user;
            user.email = email;
            return user.save();
        })
        .then(() => {
            res.send({
                success: true,
                message: i18n.__('api.user.emailUpdateSuccess')
            })
        })
        .catch(error => {
            res.send({
                success: false,
                message: error.message || i18n.__('sse'),
                error: error
            })
        })
}

module.exports.update = function (req, res, next) {
    let user = req.data.user;
    let update = {};
    if (req.body.firstName !== undefined && typeof req.body.firstName === 'string')
        update.firstName = req.body.firstName;
    if (req.body.lastName !== undefined && typeof req.body.lastName === 'string')
        update.lastName = req.body.lastName;
    if (req.body.about !== undefined && typeof req.body.about === 'string')
        update.about = req.body.about;
    if (req.body.country !== undefined && typeof req.body.country === 'string')
        update.country = req.body.country;
    if (req.body.mobile !== undefined && typeof req.body.mobile === 'string') {
        update.mobile = req.body.mobile;
        update.mobileConfirmed = false;
    }
    Object.keys(update).map(key => {
        user[key] = update[key]
    });
    user.save();
    res.send({
        success: true,
        message: i18n.__('api.user.dataUpdateSuccess'),
        updatedFields: update
    })
    // let user = req.data.user;
    // return user.save();
}

module.exports.transactions = function (req, res, next) {
    let currentUser = req.data.user;

    currentUser.getBalance()
        .then(({transactions, balance}) => {
            res.send({
                success: true,
                balance,
                transactions
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

module.exports.withdraw = function (req, res, next) {
    let token = Token.findByCode(req.body.token);
    let amount = req.body.amount;
    let to = req.body.to;
    let currentUser = req.data.user;

    if (!token) {
        return res.send({
            success: false,
            message: i18n.__('api.user.tokenInvalid')
        })
    }

    currentUser.getBalance()
        .then(({balance}) => {
            if (amount <= 0)
                throw {message: i18n.__('api.user.tokenAmountPositive')};
            if (amount > balance[token.code])
                throw {message: i18n.__('api.user.tokenNotSufficient')};
            return new Transaction({
                count: amount,
                token: token.code,
                status: Transaction.STATUS_NEW,
                from: currentUser.address,
                to: to,
                txTime: Date.now(),
            }).save()
        })
        .then(() => currentUser.getBalance())
        .then(({transactions, balance}) => {
            res.send({
                success: true,
                balance,
                transactions
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

module.exports.unreadMessages = function (req, res, next) {
    let currentUser = req.data.user;

    Trade.find({$or: [{user: currentUser._id}, {advertisementOwner: currentUser._id}]})
        .then(trades => trades.map(t => t._id))
        .then(tradesID => TradeMessage.find({
            sender: {$ne: currentUser._id},
            [`seen.${currentUser._id}`]: null,
            trade: {$in: tradesID}
        }))
        .then(unseenMessages => {
            let unreadMessages = {};
            unseenMessages.map(msg => {
                if (unreadMessages[msg.trade] === undefined)
                    unreadMessages[msg.trade] = [];
                unreadMessages[msg.trade].push(msg._id);
            });
            res.send({
                success: true,
                unreadMessages
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

module.exports.readTradeMessages = function (req, res, next) {
    let currentUser = req.data.user;

    Trade.findOne({
        _id: req.body.tradeId,
        $or: [
            {user: currentUser._id},
            {advertisementOwner: currentUser._id},
            {disputeOperator: currentUser._id},
        ]
    })
        .then(trade => {
            if (!trade)
                throw {message: i18n.__('api.user.tradeNotFound')}
            return TradeMessage.updateMany({
                trade: trade._id,
                sender: {$ne: currentUser._id}
            }, {
                [`seen.${currentUser._id}`]: true
            }, {
                upsert: false
            });
        })
        .then(() => {
            return res.send({
                success: true
            });
        })
        .catch(error => {
            console.log(error);
            res.status(500).send({
                success: false,
                message: error.message || i18n.__('sse'),
                error
            })
        })
}