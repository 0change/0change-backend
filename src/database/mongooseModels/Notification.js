const mongoose = require('mongoose');

let currentSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'user',
        required: [true, 'Advertisement user required.']
    },
    message: String,
    data: {
        type: Object,
        default: {}
    },
    seen: {type: Boolean, default: false}
}, {timestamps: true});

// notifications will be removed, after 5 days.
currentSchema.index({createdAt: 1}, {expireAfterSeconds: 5 * 24 * 3600});


module.exports = mongoose.model('notifications', currentSchema);