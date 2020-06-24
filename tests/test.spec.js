const supertest = require('supertest');
const app = require('../index');
const path = require('path');
const rimraf = require("rimraf");
const http = require('http');
const socketServer = require("../sockets/SocketService");

const request = supertest(app.app);

const auth = require('./authorization');
const api = require('./api');
const resolver = require('./resolver');
const docker = require('./docker');

const { killAll } = require('../helpers/docker');

let socket;
let httpServer;
let httpServerAddr;
let ioServer;

beforeAll(async (done) => {
    process.env.NODE_ENV = "test";
    await global.MongoTests.setupTestEnvironment();

    httpServer = http.createServer().listen(8080);
    console.log(httpServer);
    // httpServerAddr = httpServer.address();
    httpServerAddr = {
        address: "localhost",
        port: 8080
    }

    console.log(httpServerAddr);

    ioServer = (new socketServer(httpServer)).start();
    done();
})

afterAll(async (done) => {
    // killAll();
    // rimraf.sync(path.join(__dirname, '..', 'data', 'testuser'));
    // rimraf.sync(path.join(__dirname, '..', 'data', 'testfreeuser'));   
    
    httpServer.close();
    done();
})

describe("Authorization Tests", () => auth.tests(request))
describe("API Tests", () => api.tests(request))
describe("App Resolver Tests", () => resolver.tests(request, app.arServer.getInjectedJs()))
describe("Docker Tests", () => docker.tests(request, app.socketService, httpServerAddr))