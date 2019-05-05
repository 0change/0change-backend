const mongoose = require('mongoose');
const jsonwebtoken = require('jsonwebtoken');
const Transaction = require('./Transaction');
const Token = require('./Token');
const Advertisement = require('./Advertisement');

let userSchema = mongoose.Schema({
  username: {type:String, default: "", trim: true, unique: true},
  firstName: {type:String, default: "", trim: true},
  lastName: {type:String, default: "", trim: true},
  about: {type:String, default: ''},
  avatar: {type:String, default: ''},
  brightIdPublicKey: {type: String, select: false},
  brightIdScore: {type: Number, default: 0},
  country: {type:String, default: "", trim: true},
  email: {type:String, default: "", trim: true, select: false},
  emailConfirmed: {type:mongoose.Schema.Types.Boolean, default: false, trim: true},
  mobile: {type:String, default: "", trim: true, select: false},
  mobileConfirmed: {type:mongoose.Schema.Types.Boolean, default: false, trim: true},
  address: {type: String, unique: true, sparse: true},
  score: {type: Number, default: 0},
  confirmedTrades: {type: Number, default: 0},
  balance: {type: Object, default: {}},
  lastSeen: {type: Date, default: null}
}, {
  timestamps: true,
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

userSchema.methods.createSessionToken = function () {
  const sessionToken = jsonwebtoken.sign(
      {
        id: this._id,
        timestamp: Date.now(),
      },
      process.env.JWT_AUTH_SECRET
  );
  return sessionToken;
};

userSchema.methods.getBalance = function () {
  return Transaction.find({$or:[{from: this.address},{to: this.address}]})
      .then(transactions => {
        let balance = {};
        transactions.map(tx => {
          if(!balance[tx.token])
            balance[tx.token] = 0;
          if(tx.to === this.address){
              // deposit
              if(tx.status === Transaction.STATUS_DONE) {
                  balance[tx.token] += tx.count;
              }
          }
          else{
              // withdraw
              if(tx.status !== Transaction.STATUS_CANCEL)
                  balance[tx.token] -= tx.count;
          }
        });
        return {
          balance,
          transactions
        }
      })
};
userSchema.methods.getTokenBalance = function (tokenCode) {
  return Transaction.find({
    $and:[
      {token: tokenCode},
      {
        $or:[
          {from: this.address},
          {to: this.address}
        ]
      }
    ],
  })
      .then(transactions => {
        let balance = 0;
        transactions.map(tx => {
            if(tx.to === this.address){
                // deposit
                if(tx.status === Transaction.STATUS_DONE) {
                    balance += tx.count;
                }
            }
            else{
                // withdraw
                if(tx.status !== Transaction.STATUS_CANCEL)
                    balance -= tx.count;
            }
        });
        return {
          balance,
          transactions
        }
      })
};
userSchema.methods.updateTokenAdvertisements = function(code){
  let token = Token.findByCode(code);
  let tokenBalance;
  this.getTokenBalance(code)
      .then(({balance}) => {
        tokenBalance = balance;
        return Advertisement.updateMany({
            type: 'sell',
            token: token._id,
            user: this._id,
          },{'filters.ownerBalance': tokenBalance})
      });
}

module.exports = mongoose.model('user', userSchema);