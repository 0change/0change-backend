const Trade = require('../database/mongooseModels/Trade');
const TradeMessage = require('../database/mongooseModels/TradeMessage');
const Transaction = require('../database/mongooseModels/Transaction');
const Wallet = require('../database/mongooseModels/Wallet');
const Token = require('../database/mongooseModels/Token');
const balanceScript = require('../../scripts/wallet_balance');
const txScript = require('../../scripts/get_transaction');
const ERC20 = require('../../scripts/ERC20');

module.exports.getWithdrawals = function (req, res, next) {
    let currentTransactions = [];
    let itemPerPage = parseInt(req.body.itemPerPage) || 2;
    let page = parseInt(req.body.page) || 0;
    Transaction.find({
        "info.tx_hash": null,
        trade: null
    })
        .sort({createdAt: -1})
        .limit(itemPerPage)
        .skip(page * itemPerPage)
        .then(transactions => {
            currentTransactions = transactions;
            return Transaction.find({"info.tx_hash": null, trade: null}).count();
        })
        .then(count => {
            res.send({
                success: true,
                page,
                itemPerPage,
                totalCount: count,
                transactions: currentTransactions,
                ERC20
            });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({
                success: false,
                message: error.message || "Server side error",
                error
            });
        })
};
module.exports.setPaid = function (req, res, next) {
    let localTx = null;
    Transaction.findOne({
        _id: req.body.id,
        status: {$in: ['new', 'fail']}
    })
        .then(transaction => {
            if (!transaction)
                throw {message: 'Transaction invalid'};
            localTx = transaction
            transaction.txHash = req.body.txHash;
            transaction.status = Transaction.STATUS_PENDING;
            return transaction.save();
        })
        .then(() => {
            res.send({
                success: true,
                transaction: localTx
            });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({
                success: false,
                message: error.message || "Server side error",
                error
            });
        })
};
module.exports.setPaidManually = function (req, res, next) {
    let localTx = null;
    Transaction.findOne({
        _id: req.body.id,
        status: {$in: ['new', 'pending', 'fail']}
    })
        .then(transaction => {
            if (!transaction)
                throw {message: 'Transaction invalid'};
            localTx = transaction
            transaction.txHash = req.body.txHash;
            transaction.status = Transaction.STATUS_PENDING;
            return transaction.save();
        })
        .then(() => {
            res.send({
                success: true,
                transaction: localTx
            });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({
                success: false,
                message: error.message || "Server side error",
                error
            });
        })
}
module.exports.checkStatus = function (req, res, next) {
    let localTx = null;
    let blockchainTx = null;
    Transaction.findOne({
        _id: req.body.id,
    })
        .then(tx => {
            localTx = tx;
            if (tx.status === 'new')
                throw {message: "Transaction not started."};
            return txScript.run(tx.txHash);
        })
        .then(tx => {
            blockchainTx = tx;
            if (tx) {
                if (tx.status)
                    localTx.status = Transaction.STATUS_DONE;
                else
                    localTx.status = Transaction.STATUS_FAIL;
                localTx.save();
            }
            res.send({
                success: true,
                status: localTx.status,
                transaction: tx,
            });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({
                success: false,
                message: error.message || "Server side error",
                error
            });
        })
};
module.exports.getDisputes = function (req, res, next) {
    let itemPerPage = parseInt(req.body.itemPerPage) || 2;
    let page = parseInt(req.body.page) || 0;
    Trade.find({
        "status": Trade.STATUS_DISPUTE
    })
        .populate({path: 'advertisement', populate: {path: 'token'}})
        .populate('user')
        .populate('advertisementOwner')
        .sort({createdAt: -1})
        .then(trades => {
            res.send({
                success: true,
                trades
            });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({
                success: false,
                message: error.message || "Server side error",
                error
            });
        })
};
module.exports.unreadMessages = function (req, res, next) {
    let currentUser = req.data.user;
    Trade.find({disputeOperator: currentUser._id})
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
                message: error.message || "",
                error
            })
        })
}
module.exports.getWithdrawWallets = function (req, res, next) {
    let aggregation = [
        {$match: {assigned: true}},
        {$lookup: {from: 'transactions', localField: 'address', foreignField: 'to', as: 'txs'}},
        {
            $addFields: {
                "txs": {
                    $filter: {
                        input: "$txs",
                        as: "tx",
                        cond: {$ifNull: ["$$tx.info.tx_hash", false]}
                    }
                }
            }
        },
        {
            $addFields: {
                "txCount": {$size: "$txs"}
            }
        },
        {$match: {txCount: {$gt: 0}}},
        {$project: {_id: 1, address: 1, user: 1}},
        {$lookup: {from: 'users', localField: 'user', foreignField: '_id', as: 'user'}},
        {
            $addFields: {
                user: {"$arrayElemAt": ["$user", 0]}
            }
        }
        // .sort({createdAt: 1})
    ]
    Wallet.aggregate(aggregation, function (error, wallets) {
        if (error) {
            console.log(error);
            res.status(500).json({
                success: false,
                message: error.message || "Server side error",
                error
            });
        } else {
            res.send({
                success: true,
                wallets,
            });
        }
    })
};
module.exports.checkWalletBalance = function (req, res, next) {
    let {address} = req.body;
    let tokens = [];
    Token.find({})
        .then(allTokens => {
            tokens = allTokens;
            return Promise.all(
                allTokens.map(token => {
                    return balanceScript.run(address, token.contractAddress)
                })
            )
        })
        .then(balances => {
            let result = {};
            for (let i = 0; i < tokens.length; i++) {
                result[tokens[i].code] = balances[i]
            }
            res.send({
                success: true,
                balances: result
            })
        })
        .catch(error => {
            console.log(error);
            res.send({
                success: false,
                message: error.message,
                error
            })
        })
}