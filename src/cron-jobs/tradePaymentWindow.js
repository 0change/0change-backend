const CronJob = require('cron').CronJob;
// const moment = require('moment');
// const Trade = require('../database/mongooseModels/Trade');
// const TradeMessage = require('../database/mongooseModels/TradeMessage');
// const Transaction = require('../database/mongooseModels/Transaction');
// const NotificationController = require('../controllers/NotificationController');

function cancelTradeAfterTimeExpire(){
    // Trade.find({status: 'start', paymentExpiration: {$lt: Date.now()}})
    //     .populate('user')
    //     .populate({path: 'advertisement', populate: [{path: 'user'}, {path: 'token'}]})
    //     .then(trades => {
    //         if(trades.length > 0)
    //             console.log(`[${trades.length}] trade need to be canceled. time: ${moment().format('HH:mm:ss')}`);
    //         trades.map(trade => {
    //             trade.status = Trade.STATUS_CANCEL;
    //             Transaction.updateOne({trade: trade._id},{$set:{status: Transaction.STATUS_CANCEL}},()=>{});
    //             Trade.updateOne({_id: trade._id}, {$set:{status: Trade.STATUS_CANCEL}},()=>{});
    //             new TradeMessage({
    //                 trade,
    //                 type: TradeMessage.TYPE_EVENT,
    //                 content: 'TRADE_EVENT_MESSAGE_PAYMENT_WINDOW_TIMEOUT'
    //             }).save();
    //             NotificationController.tradeStateChanged(trade, Trade.STATUS_CANCEL);
    //             NotificationController.notifyUser(
    //                 trade.advertisement.user,
    //                 'Your Trade payment window timed out and has been canceled by ZeroChange.',
    //                 [{type: 'trade-open', params: {id: trade._id}}]
    //             );
    //             NotificationController.notifyUser(
    //                 trade.user,
    //                 'Your Trade payment window timed out and has been canceled by ZeroChange.',
    //                 [{type: 'trade-open', params: {id: trade._id}}]
    //             );
    //         })
    //     })
}

module.exports.start = function () {
    /**
     * constructor(cronTime, onTick, onComplete, start, timezone, context, runOnInit, unrefTimeout)
     */
    new CronJob('0,5,10,15,20,25,30,35,40,45,50,55 * * * * *', cancelTradeAfterTimeExpire, null, true, 'America/Los_Angeles');
}