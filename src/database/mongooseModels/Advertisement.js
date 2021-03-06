const mongoose = require('mongoose');
const Token = require('./Token');

const TYPE_SELL = 'sell';
const TYPE_BUY = 'buy';

const dayOpeningHourSchema = new mongoose.Schema({
  start: {
    type: Number,
    validate: {
      validator: function(v) {
        return /^\d+$/.test(v);
      },
      message: props => `${props.value} is not a valid time string.`
    },
    required:[true, 'Opening start hour required.']
  },
  end: {
    type: Number,
    validate: {
      validator: function(v) {
          return /^\d+$/.test(v);
      },
      message: props => `${props.value} is not a valid time window.!`
    },
    required:[true, 'Opening end hour required.']
  },
  enable: Boolean
}, {_id: false});

const advFiltersSchema = new mongoose.Schema({
    token: {type: String, required: [true, "Advertisement filters.token required"]},
    currency: {type: String, required: [true, "Advertisement filters.currency required"]},
    ownerBrightIdScore: {type: Number, default: 0},
    ownerFeedbackScore: {type: Number, default: 0},
    ownerBalance:{type: Number, default: 0},
}, {_id: false});

let currentSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, ref: 'user',
    required:[true, 'Advertisement user required.']
  },
  type: {
    type:String,
    enum:[TYPE_BUY, TYPE_SELL],
    required:[true, 'Advertisement type required.']
  },
  token: {
    type: mongoose.Schema.Types.ObjectId, ref: 'crypto_token',
    required:[true, 'Advertisement token required.']
  },
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId, ref: 'payment_method',
    required:[true, 'Advertisement token required.']
  },
  paymentWindow: {
    type: String,
    validate: {
      validator: function(v) {
        return /\d{2}\:\d{2}/.test(v);
      },
      message: props => `${props.value} is not a valid time window. example: (04:05)!`
    },
    required:[true, 'Advertisement paymentWindow required.']
  },
  amount: Number,
  currency: {
    type: mongoose.Schema.Types.ObjectId, ref: 'currency',
    required:[true, 'Advertisement currency required.']
  },
  limitMin: {type: Number, required:[true, 'Advertisement limitMin required.']},
  limitMax: {type: Number, required:[true, 'Advertisement limitMax required.']},
  enable: {type: Boolean, default: true},
  ownerBalanceEnough:{
    type: Boolean,
    default: false
  },
  openingHours: {
    type: [dayOpeningHourSchema],
    validate: {
      validator: function(v) {
        // should contain 7 days data.
        if(v.length !== 7)
          return false;
      },
      message: props => `${props.value} is not a valid opening hours data.`
    },
    required:[true, 'Advertisement openingHours required.']
  },
  terms:{type: String, default: ""},
  filters: {type: advFiltersSchema, select: false},
  deleted: {type: Boolean, default: false},
}, {timestamps: true});

module.exports = mongoose.model('advertisement', currentSchema);

module.exports.TYPE_BUY = TYPE_BUY;
module.exports.TYPE_SELL= TYPE_SELL;