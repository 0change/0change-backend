const mongoose = require('mongoose');

let tokenSchema = mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
  token: String,
  active: {type: Boolean, default: false},
}, {timestamps: true});

tokenSchema.methods.maskedData = function () {
  return {
    token: this.token,
    os: this.os,
    osVersion: this.osVersion,
    device: this.device
  };
}

const UserSession = module.exports = mongoose.model('user_session', tokenSchema);