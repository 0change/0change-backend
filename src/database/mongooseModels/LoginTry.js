const mongoose = require('mongoose');

let currentSchema = mongoose.Schema({
    aesKey: String,
    uuid: String,
    qrString: String,
    qrImage:String,
    userInfo: Object
}, {timestamps: true});
currentSchema.index({createdAt: 1},{expireAfterSeconds: 3600});


const schemaModel = module.exports = mongoose.model('login-try', currentSchema);


