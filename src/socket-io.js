const socketIo = require('socket.io');
const UserController = require('./controllers/UserController');
const EventBus = require('./eventBus');
var io = null;
var socketNamespace = null;
var online = 0;

var userMap = {};

function initSocket(expressServer){
    io = socketIo(expressServer);
    socketNamespace = io.of('/socket.io');
    socketNamespace.on('connection', onSocketConnect);
    return socketNamespace;
}

function onSocketConnect(client){
    online ++;
    console.log(`new client connect. online: [${online}]`);
    let userId = null;

    client.on('socket-id', function(socketId){
        UserController.decodeSocketId(socketId)
            .then(info => {
                userId = info.id;
                userMap[userId] = client;
                EventBus.emit(EventBus.EVENT_SOCKET_USER_CONNECT, userId)
                // client.emit('notification', `{"message": "welcom signed user", "data":{"commands": [{"type": "trades-list"}]}}`);
                // setInterval(()=>{
                //     client.emit('notification', `{"message": "time is: ${Date.now()}"}`);
                // }, 5000);
            })
            .catch(error => {
                console.error(error);
            })
    });

    client.on('read-notification', function (notificationId) {
        if(userId)
            EventBus.emit(
                EventBus.EVENT_SOCKET_USER_READ_NOTIFICATION,
                {userId, notificationId}
            )
    })

    client.on('join', function(roomId){
        console.log(`client joined to room [${roomId}]`);
        client.join(roomId);
    });

    client.on('leave', function(roomId){
        console.log(`client leaved to room [${roomId}]`);
        client.leave(roomId);
    });

    client.on('disconnect', function () {
        online --;
        console.log(`client disconnect. online: [${online}]`);
        if(userId) {
            delete userMap[userId];
            userId = null;
        }
        client.emit('disconnected');
    });
}

function isUserConnected(user) {
    if(user._id)
        user = user._id;
    return !!userMap[user.toString()];
}

function notifyToRoom(room, message){
    if(typeof message === 'string')
        message = {message: message};
    message = JSON.stringify(message);
    socketNamespace.to(room).emit('notification', message);
}

function sendSignalToUser(userId, signal, data) {
    if(!userMap[userId])
        return;
    if(typeof data !== 'string')
        data = JSON.stringify(data);
    userMap[userId].emit(signal, data);
}

function sendNotificationToUser(userId, data) {
    sendSignalToUser(userId, 'notification', data)
}

function sendSignalToRoom(room, signal, data){
    if(typeof data !== 'string')
        data = JSON.stringify(data);
    socketNamespace.to(room).emit(signal, data);
}

function signalToRoom(room, message){
    if(typeof message === 'string')
        message = {type: message, message: message};
    message = JSON.stringify(message);
    socketNamespace.to(room).emit('signals', message);
}

module.exports = {
    initSocket,
    notifyToRoom,
    sendSignalToRoom,
    //sendSignalToUser,
    sendNotificationToUser,
}