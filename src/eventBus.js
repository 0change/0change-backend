const EventEmitter = require('events');
const ee = new EventEmitter();

module.exports = ee;

module.exports.EVENT_TRANSACTION_POST_SAVE = 'transaction_post_save';
module.exports.EVENT_SOCKET_USER_CONNECT = 'user_socket_connect';
module.exports.EVENT_SOCKET_USER_READ_NOTIFICATION = 'user_socket_read_notification';
module.exports.EVENT_USER_BALANCE_NEED_TO_UPDATE = 'user_balance_need_to_update';
module.exports.EVENT_TRADE_POST_SAVE = 'trade_post_save';
module.exports.EVENT_DISPUTE_POST_SAVE = 'dispute_post_save';
module.exports.EVENT_TRADE_POST_FEEDBACK = 'trade_post_feedback';
module.exports.EVENT_BRIGHTID_SCORE_UPDATED = 'broghtID_score_updated';