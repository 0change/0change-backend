const mongoose = require('mongoose');

let tokenSchema = mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
  token: String,
  lastSeen: Number,
  active: {type: Boolean, default: false},
}, {timestamps: true});

// will delete after 3600 seconds
tokenSchema.index({updatedAt: 1},{expireAfterSeconds: 6 * 3600});

tokenSchema.methods.maskedData = function () {
  return {
    token: this.token,
    os: this.os,
    osVersion: this.osVersion,
    device: this.device
  };
}

const UserSession = module.exports = mongoose.model('user_session', tokenSchema);