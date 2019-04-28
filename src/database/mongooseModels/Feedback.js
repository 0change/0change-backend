const mongoose = require('mongoose');
const EventBus = require('../../eventBus');

let currentSchema = mongoose.Schema({
  sender: {type: mongoose.Schema.Types.ObjectId, ref: 'user', required: [true, "Sender required for feedback."]},
  trade: {type: mongoose.Schema.Types.ObjectId, ref: 'trade', required: [true, "Trade required for feedback."]},
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'user', required: [true, "User required for feedback."]},
  star: {type: Number, required: [true, "Star required for feedback."]},
  comment: {type: String, default: null},
}, {timestamps: true});

currentSchema.post('save', function(doc) {
  EventBus.emit(EventBus.EVENT_TRADE_POST_FEEDBACK, doc);
});

currentSchema.index({ sender: 1, trade: 1, user: 1}, { unique: true });

module.exports = mongoose.model('feedback', currentSchema);