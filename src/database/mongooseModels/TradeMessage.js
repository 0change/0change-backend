const mongoose = require('mongoose');

const TYPE_MESSAGE = 'message';
const TYPE_EVENT = 'event';

const currencySchema = mongoose.Schema({
    trade: {
        type: mongoose.Schema.Types.ObjectId, ref: 'trade',
        required: [true, 'Trade required for creating TradeMessage.']
    },
    type: {
        type:String,
        enum:[TYPE_MESSAGE, TYPE_EVENT],
        default: TYPE_MESSAGE
    },
    content: {
        type: String,
        required: [true, 'Trade message content required.']
    },
    attachments: {
        type: [String],
        default: []
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId, ref: 'user',
        // system message will sent by null sender.
        default: null
    },
    seen: {
        type: Object,
        default: {}
    }
}, {timestamps: true});

currencySchema.pre('find', function () {
    this.populate('sender');
});

module.exports = mongoose.model('trade_message', currencySchema);
module.exports.TYPE_MESSAGE = TYPE_MESSAGE;
module.exports.TYPE_EVENT = TYPE_EVENT;