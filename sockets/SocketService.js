const socketIO = require('socket.io');

class SocketService {
  constructor(server) {
    this.socketServer = socketIO(server);
  }

  start() {
    this.socketServer.on('connection', socket => {
      console.log('connected')
      socket.emit("hello world");

      socket.on('disconnect', () => {
        console.log('disconnected')
      });
    });
  }
}

module.exports = SocketService;