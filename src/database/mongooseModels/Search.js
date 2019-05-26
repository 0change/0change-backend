const mongoose = require('mongoose');

let currentSchema = mongoose.Schema({
    query: {type: Object, default: {}},
    filters:{type: Object, default: {}},
    results:{type: [mongoose.Schema.Types.ObjectId], default: []},
    count: {type: Number, default: 0}
}, {timestamps: true});

// will delete after 3600 seconds
currentSchema.index({createdAt: 1},{expireAfterSeconds: 3600});

let Model = module.exports = mongoose.model('search', currentSchema);