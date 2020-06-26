const socketIO = require('socket.io');
const Docker = require('../helpers/docker');
const { spawn } = require('child_process');

class SocketService {
  /**
   * Creates a socket server that will listen for specified endpoints.
   * 
   * @constructor
   * @param {socketIO} server 
   */
  constructor(server) {
    this.socketServer = require('socket.io')(server);
    this.listeningToLogs = {};
  }

  /**
   * Starts listening for specified endpoints
   * @returns {void}
   */
  start() {
    this.socketServer.on('connection', socket => {
      socket.on('kill terminal', async (username, cb = () => {}) => {
        socket.leave(username);
        Docker.kill(username).then(() => {
          cb();
        });
      })

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
          const currentLogs = await Docker.getLogs(username);
          socket.join(username)
        
          cb(currentLogs);
        } catch(e) {
          console.log(e);
          cb(e)
        }
      })

      socket.on("disconnecting", async () => {
        socket.leave(Object.keys(socket.rooms)[1]);
        Docker.kill(username).then(() => {
          delete this.listeningToLogs[Object.keys(socket.rooms)[1]];

          cb();
        });
      })

      socket.on('disconnect', () => {
      });
    });
  }
}

module.exports = SocketService;