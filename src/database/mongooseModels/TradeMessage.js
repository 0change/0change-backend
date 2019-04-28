const mongoose = require('mongoose');

const currencySchema = mongoose.Schema({
  trade: {
    type: mongoose.Schema.Types.ObjectId, ref: 'trade',
    required:[true, 'Trade required for creating TradeMessage.']
  },
  content: {
    type: String,
    required:[true, 'Trade message content required.']
  },
  attachments: {
    type: [String],
    default: []
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId, ref: 'user',
    required:[true, 'Trade message sender required.']
  },
}, {timestamps: true});

currencySchema.pre('find', function() {
  this.populate('sender');
});

module.exports = mongoose.model('trade-message', currencySchema);