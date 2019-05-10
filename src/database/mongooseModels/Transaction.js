const mongoose = require('mongoose');
const User = require('./User');
const EventBus = require('../../eventBus');

const TYPE_DEPOSIT = 'deposit';
const TYPE_WITHDRAW = 'withdraw';
const TYPE_TRADE = 'trade';

const STATUS_NEW = 'new';
const STATUS_PENDING = 'pending';
const STATUS_DONE = 'done';
const STATUS_CANCEL = 'cancel';
const STATUS_FAIL = 'fail';

let modelSchema = mongoose.Schema({
    status: {
        type: String,
        enum: [STATUS_NEW, STATUS_PENDING, STATUS_DONE, STATUS_CANCEL, STATUS_FAIL],
        required: [true, 'Transaction status required.']
    },
    txHash: {
        type: String,
        unique: true,
        sparse: true
    },
    from: {
        type: String,
        required: [true, 'Transaction from required.']
    },
    to: {
        type: String,
        required: [true, 'Transaction to required.']
    },
    token: {
        type: String,
        required: [true, 'Transaction token required.']
    },
    trade: {
        type: mongoose.Schema.Types.ObjectId, ref: 'trade',
        default: null
    },
    txTime: mongoose.Schema.Types.Date,
    count: Number,
    comments: {
        type: String,
        default: ""
    },
    info: {
        type: Object,
    }
}, {timestamps: true});

modelSchema.post('save', function (doc) {
    EventBus.emit(EventBus.EVENT_TRANSACTION_POST_SAVE, doc);
});

const Model = module.exports = mongoose.model('transaction', modelSchema);

module.exports.STATUS_NEW = STATUS_NEW;
module.exports.STATUS_PENDING = STATUS_PENDING;
module.exports.STATUS_DONE = STATUS_DONE;
module.exports.STATUS_CANCEL = STATUS_CANCEL;
module.exports.STATUS_FAIL = STATUS_FAIL;