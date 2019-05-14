const CronJob = require('cron').CronJob;
const moment = require('moment');
const Trade = require('../database/mongooseModels/Trade');

function cancelTradeAfterTimeExpire(){
    // console.log('cancelTradeAfterTimeExpire: calls every 5 minutes');
    Trade.find({status: 'start', paymentExpiration: {$lt: Date.now()}})
        .then(trades => {
            console.log(`[${trades.length}] trade need to be canceled. time: ${moment().format('HH:mm:ss')}`);
        })
}

module.exports.start = function () {
    /**
     * constructor(cronTime, onTick, onComplete, start, timezone, context, runOnInit, unrefTimeout)
     */
    new CronJob('0 0,5,10,15,20,25,30,35,40,45,50,55 * * * *', cancelTradeAfterTimeExpire, null, true, 'America/Los_Angeles');
}