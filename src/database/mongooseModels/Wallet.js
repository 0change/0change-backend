const mongoose = require('mongoose');

let modelSchema = mongoose.Schema({
  assigned: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, ref: 'user',
    unique: true,
    sparse: true
  },
  address: {
    type: String,
    unique: true,
    required: [true, "Wallet publicKey required"]
  },
  privateKey: {
    type: String,
    unique: true,
    sparse: true
  }
}, {timestamps: false});

const Model = module.exports = mongoose.model('wallet', modelSchema);