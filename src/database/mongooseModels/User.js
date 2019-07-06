const mongoose = require('mongoose');
const jsonwebtoken = require('jsonwebtoken');
const Transaction = require('./Transaction');
const Token = require('./Token');
const Advertisement = require('./Advertisement');
const moment = require('moment');

const PERMISSION_ADMIN = 'admin';
const PERMISSION_OPERATOR = 'operator';

let userSchema = mongoose.Schema({
    username: {type: String, default: "", trim: true, unique: true},
    firstName: {type: String, default: "", trim: true},
    lastName: {type: String, default: "", trim: true},
    about: {type: String, default: ''},
    avatar: {type: String, default: ''},
    brightIdPublicKey: {type: String, select: false},
    brightIdScore: {type: Number, default: 0},
    country: {type: String, default: "", trim: true},
    email: {type: String, default: "", trim: true, select: false},
    emailConfirmed: {type: mongoose.Schema.Types.Boolean, default: false, trim: true},
    recoveryWallet: {type: String, default: "", trim: true, select: false},
    mobile: {type: String, default: "", trim: true, select: false},
    mobileConfirmed: {type: mongoose.Schema.Types.Boolean, default: false, trim: true},
    address: {type: String, unique: true, sparse: true},
    score: {type: Number, default: 0},
    confirmedTrades: {type: Number, default: 0},
    balance: {type: Object, default: {}},
    lastSeen: {type: Date, default: null},
    permissions: {
        type: [{
            type: String,
            enum: [PERMISSION_ADMIN, PERMISSION_OPERATOR],
            required: [true, 'Trade type required']
        }],
        default: []
    }
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
    return Transaction.find({$or: [{from: this.address}, {to: this.address}]})
        .then(transactions => {
            let balance = {};
            transactions.map(tx => {
                if (!balance[tx.token])
                    balance[tx.token] = 0;
                if (tx.to === this.address) {
                    // deposit
                    if (tx.status === Transaction.STATUS_DONE) {
                        balance[tx.token] += tx.count;
                    }
                }
                else {
                    // withdraw TODO: when transaction failed ????
                    if (tx.status !== Transaction.STATUS_CANCEL)
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
        $and: [
            {token: tokenCode},
            {
                $or: [
                    {from: this.address},
                    {to: this.address}
                ]
            }
        ],
    })
        .then(transactions => {
            let balance = 0;
            transactions.map(tx => {
                if (tx.to === this.address) {
                    // deposit
                    if (tx.status === Transaction.STATUS_DONE) {
                        balance += tx.count;
                    }
                }
                else {
                    // withdraw
                    if (tx.status !== Transaction.STATUS_CANCEL)
                        balance -= tx.count;
                }
            });
            return {
                balance,
                transactions
            }
        })
};
userSchema.methods.updateTokenAdvertisements = function (code) {
    let token = Token.findByCode(code);
    let tokenBalance;
    this.getTokenBalance(code)
        .then(({balance}) => {
            tokenBalance = balance;
            return Advertisement.updateMany({
                type: 'sell',
                token: token._id,
                user: this._id,
            }, {'filters.ownerBalance': tokenBalance})
        });
}
userSchema.methods.hasPermissions = function (checkList) {
    for (let i = 0; i < checkList.length; i++) {
        if (this.permissions.indexOf(checkList[i]) < 0)
            return false;
    }
    return true;
}

userSchema.virtual('lastSeenInfo').get(function () {
    let lastSeen = {
        time: this.lastSeen,
        minutes: moment.duration(moment().diff(this.lastSeen)).asMinutes(),
        duration: moment.duration(moment().diff(this.lastSeen)),
        // title: moment(this.lastSeen).fromNow()
    };
    return lastSeen;
});

userSchema.virtual('joinedInfo').get(function () {
    let joined = {
        time: this.createdAt,
        minutes: moment.duration(moment().diff(this.createdAt)).asMinutes(),
        title: moment(this.createdAt).fromNow()
    };
    return joined;
});

userSchema.pre('find', function () {
});

module.exports = mongoose.model('user', userSchema);

module.exports.PERMISSION_ADMIN = PERMISSION_ADMIN;
module.exports.PERMISSION_OPERATOR = PERMISSION_OPERATOR;