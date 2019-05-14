const socketIo = require('socket.io');
var io = null;
var online = 0;

function initSocket(expressServer){
    io = socketIo(expressServer);
    io.on('connection', onSocketConnect);
    return io;
}

function onSocketConnect(client){
    online ++;
    console.log(`new client connect. online: [${online}]`);

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
        console.log(`client disconnect. online: [${online}]`)
        client.emit('disconnected');
    });
}

function notifyToRoom(room, message){
    if(typeof message === 'string')
        message = {message: message};
    message = JSON.stringify(message);
    io.to(room).emit('notification', message);
}

function sendSignalToRoom(room, signal, message){
    if(typeof message === 'string')
        message = {message: message};
    message = JSON.stringify(message);
    io.to(room).emit(signal, message);
}

function signalToRoom(room, message){
    if(typeof message === 'string')
        message = {type: message, message: message};
    message = JSON.stringify(message);
    io.to(room).emit('signals', message);
}

module.exports = {
    initSocket,
    notifyToRoom,
    sendSignalToRoom,
}