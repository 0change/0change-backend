const socketio = require('./socket-io');
const Notification = require('./database/mongooseModels/Notification');
const User = require('./database/mongooseModels/User');
const EventBus = require('./eventBus');

EventBus.on(EventBus.EVENT_SOCKET_USER_CONNECT, function (userId) {
    Notification.find({user: userId, seen: {$ne: true}})
        .then(notifications => {
            notifications.map(notif => {
                socketio.sendNotificationToUser(userId, notif);
            })
        })
        .catch(error => {
            // console.log(`User[${user._id}] total balance update failed:`, error);
        })
})
EventBus.on(EventBus.EVENT_SOCKET_USER_READ_NOTIFICATION, function ({userId, notificationId}) {
    Notification.updateOne({user: userId, _id: notificationId},{$set:{seen: true}},{upsert: false})
        .then(() => {
            // Ok
        })
        .catch(error => {
            // console.log(`User[${user._id}] total balance update failed:`, error);
        })
})

function notifyUser(user, message, data){
    if(user._id)
        user = user._id;
    let notification = new Notification({user, message, data});
    socketio.sendNotificationToUser(user, notification);
    notification.save();
}

function tradeChat(trade, sender, message){
    let chatMessage = {
        sender: {
            username: sender.username,
            id: sender._id
        },
        content: message
    };
    // console.log('notification to user', user, notification);
    socketio.sendSignalToRoom(`chat-trade-${trade._id}`,`chat-trade-${trade._id}`, chatMessage);
}
function tradeStateChanged(trade, status){
    let data = {
        tradeId: trade._id,
        status: status
    };
    // console.log('notification to user', user, notification);
    socketio.sendSignalToRoom(`chat-trade-${trade._id}`,`trade-status-changed`, data);
}
function notifyRoom(room, message, data){
    let notification = {
        message,
        data
    };
    socketio.notifyToRoom(room, notification);
}

module.exports.notifyUser = notifyUser;
module.exports.tradeChat = tradeChat;
module.exports.notifyRoom = notifyRoom;
module.exports.tradeStateChanged = tradeStateChanged;