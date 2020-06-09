const supertest = require('supertest');
const app = require('../index');

const request = supertest(app.app);

beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await global.MongoTests.setupTestEnvironment();
})

describe("Authorization Tests", () => {
    test("it should catch missing parameters in registration", async (done) => {
        const res = await request.post("/register").send({username: "test"}).set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(400);
        expect(res.body.registered).toBe(false);
        expect(res.body.reason).toBe("invalid params");

        done();
    })

    test("it should register a user", async (done) => {
        const res = await request.post("/register")
                                 .send({
                                     username: "testuser",
                                     password: "password",
                                     email: "testing@prauxy.app",
                                     name: "Test Name",
                                     org: "PRAUXY Tests",
                                     mailinglist: false
                                 }).set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body.registered).toBe(true);
        expect(res.body.token).toHaveLength(180);

        done();
    })

    test("it shouldn't let someone register a duplicate username", async(done) => {
        const res = await request.post("/register")
                                 .send({
                                     username: "testuser",
                                     password: "password",
                                     email: "testing2@prauxy.app",
                                     name: "Test Name",
                                     org: "PRAUXY Tests",
                                     mailinglist: false
                                 }).set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(409);
        expect(res.body.registered).toBe(false);
        expect(res.body.reason).toBe("username taken");

        done();
    })

    test("it shouldn't let someone register a duplicate email", async(done) => {
        const res = await request.post("/register")
                                 .send({
                                     username: "testuser2",
                                     password: "password",
                                     email: "testing@prauxy.app",
                                     name: "Test Name",
                                     org: "PRAUXY Tests",
                                     mailinglist: false
                                 }).set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(409);
        expect(res.body.registered).toBe(false);
        expect(res.body.reason).toBe("email taken");

        done();
    })

    test("it should catch missing parameters in login", async(done) => {
        const res = await request.post("/login")
                                 .send({
                                     username: "fakeuser",
                                 }).set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(400);
        expect(res.body.authenticated).toBe(false);
        expect(res.body.reason).toBe("invalid params");

        done();
    })

    test("it shouldn't let an inexistent user login", async(done) => {
        const res = await request.post("/login")
                                 .send({
                                     username: "fakeuser",
                                     password: "password"
                                 }).set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(401);
        expect(res.body.authenticated).toBe(false);
        expect(res.body.reason).toBe("invalid username");

        done();
    })

    test("it shouldn't allow an incorrect password", async(done) => {
        const res = await request.post("/login")
                                 .send({
                                     username: "testuser",
                                     password: "badpass"
                                 }).set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(401);
        expect(res.body.authenticated).toBe(false);
        expect(res.body.reason).toBe("invalid password");

        done();
    })

    test("it should allow a user to login with correct information", async(done) => {
        const res = await request.post("/login")
                                 .send({
                                     username: "testuser",
                                     password: "password"
                                 }).set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body.authenticated).toBe(true);
        expect(res.body.token).toHaveLength(180);

        global.authtoken = res.body.token;

        done();
    })

    test("it should catch missing parameters in verification request", async(done) => {
        const res = await request.post("/verify")
                                 .send({
                                     username: "testuser"
                                 }).set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(400);
        expect(res.body.verified).toBe(false);
        expect(res.body.reason).toBe("invalid params");

        done();
    })

    test("it shouldn't let an inexistent user verify a token", async(done) => {
        const res = await request.post("/verify")
                                 .send({
                                     username: "fakeuser",
                                     token: global.authtoken
                                 }).set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(409);
        expect(res.body.verified).toBe(false);
        expect(res.body.reason).toBe("incorrect token");

        done();
    })

    test("it should verify a username and token correctly", async(done) => {
        const res = await request.post("/verify")
                                 .send({
                                     username: "testuser",
                                     token: global.authtoken
                                 }).set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body.verified).toBe(true);
        expect(res.body.projects).toHaveLength(0);
        expect(res.body.trial).toHaveProperty("timeLeft");

        done();
    })

    test("it shouldn't allow a bad authorization header", async(done) => {
        const res = await request.post("/test/verifytoken")
                                 .set("Authorization", "Bearer blue")
                                 .set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(401);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("invalid authorization header");

        done();
    })

    test("it shouldn't allow an invalid authorization header", async(done) => {
        const res = await request.post("/test/verifytoken")
                                 .set("Authorization", "Bearer testuser:badtoken")
                                 .set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(401);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("invalid authorization header");

        done();
    })

    test("it should properly match feature flags with user access & let working authorization header pass", async(done) => {
        const res = await request.post("/test/verifytoken")
                                 .set("Authorization", "Bearer testuser:" + global.authtoken)
                                 .set('Host', "auth.go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body.pass).toBe(true);

        done();
    })
})