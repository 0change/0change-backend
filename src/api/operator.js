const {Router} = require('express');
const Transaction = require('../database/mongooseModels/Transaction');
const requireParam = require('../middleware/requestParamRequire');
const Token = require('../database/mongooseModels/Token');
const txScript = require('../../scripts/get_transaction');
let router = Router();
const ERC20 = require('../../scripts/ERC20');

router.all('/get-withdrawals', function (req, res, next) {
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
});

router.all('/set-paid', requireParam('id:objectId', 'txHash:string'), function (req, res, next) {
    let localTx = null;
    Transaction.findOne({
        _id: req.body.id,
        status: {$in: ['new', 'fail']}
    })
        .then(transaction => {
            if(!transaction)
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
});

router.all('/check-status', requireParam('id:objectId'), function (req, res, next) {
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
            if(tx){
                if(tx.status)
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
});

module.exports = router;