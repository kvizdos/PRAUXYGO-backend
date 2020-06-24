const socketIO = require('socket.io');
const { getLogs } = require('../helpers/docker');
const { spawn } = require('child_process');

class SocketService {
  constructor(server) {
    this.socketServer = require('socket.io')(server);
    this.listeningToLogs = {};
  }

  start() {
    this.socketServer.on('connection', socket => {
      console.log('connected')

      socket.on('join terminal', async (username, cb) => {
        if(this.socketServer.sockets.adapter.rooms[username] == undefined) {
          const newProc = spawn('sh', [ "-c", `watch "docker logs ${username}-prauxygo"` ]);
          newProc.stdout.setEncoding('utf-8');
          newProc.stderr.setEncoding('utf-8');

          newProc.stdout.on('data', (data) => {
            if(data.indexOf(`Error: No such container`) >= 0) {
              newProc.kill();
              return;
            }
            this.socketServer.to(username).emit('new logs', data);
          })

          newProc.stderr.on('data', (data) => {
            if(data.indexOf(`Error: No such container`) >= 0) {
              newProc.kill();
              return;
            }
            this.socketServer.to(username).emit('new logs', data);
          })

          this.listeningToLogs[username] = newProc;
        };

        try {
          const currentLogs = await getLogs(username);
          socket.join(username)
        
          cb(currentLogs);
        } catch(e) {
          console.log(e);
          cb(e)
        }
      })

      socket.on("disconnecting", () => {
        this.listeningToLogs[Object.keys(socket.rooms)[1]].kill('SIGKILL');
        delete this.listeningToLogs[Object.keys(socket.rooms)[1]];
      })

      socket.on('disconnect', () => {
      });
    });
  }
}

module.exports = SocketService;