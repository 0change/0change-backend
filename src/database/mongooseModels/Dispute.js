const mongoose = require('mongoose');
const EventBus = require('../../eventBus');
require('./TradeMessage');

const STATUS_START = 'start';
const STATUS_DONE = 'done';

let currencySchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, ref: 'user',
    required:[true, 'Dispute user required']
  },
  trade: {
    type: mongoose.Schema.Types.ObjectId, ref: 'trade',
    required:[true, 'Dispute trade required']
  },
  status: {
    type:String,
    enum:[STATUS_START, STATUS_DONE],
    required:[true, 'Trade status required.']
  },
}, {timestamps: true});

currencySchema.pre('find', function() {
  this.populate('messages').populate('user');
});

currencySchema.virtual('messages', {
  ref: 'dispute-message', // The model to use
  localField: '_id', // Find people where `localField`
  foreignField: 'dispute', // is equal to `foreignField`
  // count: true // And only get the number of docs
});

currencySchema.set('toObject', { virtuals: true });
currencySchema.set('toJSON', { virtuals: true });

currencySchema.post('save', function(doc) {
  EventBus.emit(EventBus.EVENT_DISPUTE_POST_SAVE, doc);
});

let Model = module.exports = mongoose.model('dispute', currencySchema);

module.exports.STATUS_START = STATUS_START;
module.exports.STATUS_DONE = STATUS_DONE;