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
        let wellcomeMessage = JSON.stringify({type: "notification", notification: "welcome dear user"});
        client.join(roomId);
        // client.emit('signals', wellcomeMessage);
    });

    client.on('disconnect', function () {
        online --;
        console.log(`client disconnect. online: [${online}]`)
        client.emit('disconnected');
    });
}

function messageToRoom(room, message){
    if(typeof message === 'string')
        message = {type: message, message: message};
    message = JSON.stringify(message);
    io.to(room).emit('signals', message);
}

module.exports = {
    io,
    initSocket,
    messageToRoom,
}