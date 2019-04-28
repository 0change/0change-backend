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
  publicKey: {
    type: String,
    unique: true,
    required: [true, "Wallet publicKey required"]
  },
  secretKey: {
    type: String,
    unique: true,
    required: [true, "Wallet privateKey required"]
  }
}, {timestamps: false});

const Model = module.exports = mongoose.model('wallet', modelSchema);