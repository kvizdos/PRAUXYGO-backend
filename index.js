// Install body-parser and Express
const app = require('express')();
const http = require('http').createServer(app);

const wsMock = require('socket.io-mock');

const socketServer = require("./sockets/SocketService");
if(process.env.NODE_ENV != "test") {
    var socketService = (new socketServer(http)).start();
}
const Authenticator = require('./authentication/authentication').Authenticator;

const APIHandler = require('./api/apihandler').APIHandler;
const AppResolver = require('./api/appresolver').AppResolver;

const dotenv = require('dotenv');
dotenv.config();

const DatabaseHelper = require('./helpers/mongo');
const MongoHelper = new DatabaseHelper.mongo();
if(process.env.NODE_ENV == "test") { 
    global.MongoTests = MongoHelper;
}
const subdomain = require('express-subdomain');

var bodyParser = require('body-parser')

const authServer = new Authenticator(MongoHelper)
const apiServer = new APIHandler(MongoHelper, authServer)
const arServer = new AppResolver(MongoHelper, authServer)

// Use req.query to read values!!
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(subdomain(`api.${process.env.NODE_ENV == "dev" ? 'test' : ''}go`, apiServer.getRoutes()))
app.use(subdomain(`auth.${process.env.NODE_ENV == "dev" ? 'test' : ''}go`, authServer.getRoutes()))
app.use(subdomain(`*.${process.env.NODE_ENV == "dev" ? 'test' : ''}go`, arServer.getRoutes()))

if(process.env.NODE_ENV != "test") {
    app.listen(8080, () => console.log('PrauxyGO backend started'))
} else {
    module.exports.app = app;
    module.exports.authServer = authServer;
    module.exports.apiServer = apiServer,
    module.exports.arServer = arServer;
    module.exports.socketService = socketService;
}