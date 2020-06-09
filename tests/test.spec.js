const supertest = require('supertest');
const app = require('../index');
const path = require('path');
const rimraf = require("rimraf");

const request = supertest(app.app);

const auth = require('./authorization');
const api = require('./api');
const resolver = require('./resolver');

beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await global.MongoTests.setupTestEnvironment();
})

afterAll(() => {
    rimraf.sync(path.join(__dirname, '..', 'data', 'testuser'));
    rimraf.sync(path.join(__dirname, '..', 'data', 'testfreeuser'));    
})

describe("Authorization Tests", () => auth.tests(request))
describe("API Tests", () => api.tests(request))
describe("App Resolver Tests", () => resolver.tests(request, app.arServer.getInjectedJs()))