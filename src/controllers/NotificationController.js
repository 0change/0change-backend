const socketio = require('../socket-io');

function notifyUser(user, message, commands=[]){
    let notification = {
        message,
        commands
    };
    // console.log('notification to user', user, notification);
    socketio.notifyToRoom(`user-${user._id}`, notification);
}

function tradeChat(trade, sender, message){
    let notification = {
        sender: {
            username: sender.username,
            id: sender._id
        },
        content: message
    };
    // console.log('notification to user', user, notification);
    socketio.sendSignalToRoom(`chat-trade-${trade._id}`,`chat-trade-${trade._id}`, notification);
}
function notifyRoom(room, message, commands=[]){
    let notification = {
        message,
        commands
    };
    socketio.notifyToRoom(room, notification);
}

module.exports = {
    notifyUser,
    tradeChat,
    notifyRoom,
}