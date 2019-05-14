var CronJob = require('cron').CronJob;
const tradePaymentWindowJob = require('./tradePaymentWindow');

/**
 * Seconds: 0-59
 * Minutes: 0-59
 * Hours: 0-23
 * Day of Month: 1-31
 * Months: 0-11 (Jan-Dec)
 * Day of Week: 0-6 (Sun-Sat)
 *
 */

function testCronJob() {
    new CronJob('0,10,20,30,40,50 * * * * *', function () {
        console.log('You will see this message every 10 secouns');
    }, null, true, 'America/Los_Angeles');
}

function init() {
    // testCronJob();
    // tradePaymentWindowJob.start();
}

module.exports = {
    init
}