const mongoose = require('mongoose');

const notificationActionSchema = new mongoose.Schema({
    type: {type: String},
    params: {type: Object},
}, {_id: false});

let currentSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'user',
        required: [true, 'Advertisement user required.']
    },
    message: String,
    commands: [notificationActionSchema],
    seen: {type: Boolean, default: false}
}, {timestamps: true});

// notifications will be removed, after 5 days.
currentSchema.index({createdAt: 1}, {expireAfterSeconds: 5 * 24 * 3600});


const Model = module.exports = mongoose.model('notifications', currentSchema);