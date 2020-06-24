const { dockerExists } = require('../helpers/docker')
const io = require('socket.io-client')

module.exports.tests = (request, socketService, httpServerAddr) => {
    let socket;
    beforeAll(async (done) => {
        console.log(httpServerAddr)
        socket = io.connect(`http://localhost:8080`, {
            'reconnection delay': 0,
            'reopen delay': 0,
            'force new connection': true,
            transports: ['websocket'],
        });
        socket.on('connect', () => {
            done();
        });
    })

    test("it should fail with a bad app ID", async (done) => {
        const res = await request.post("/docker/new")
                                 .send({type: "blah"})
                                 .set("Authorization", "Bearer testuser:" + global.authtoken)
                                 .set('Host', "api.go.prauxy.app");

        expect(res.body.reason).toBe("invalid app name")
        expect(res.status).toBe(400);

        done();
    })
    test("it should fail with a bad Docker type", async (done) => {
        const res = await request.post("/docker/new")
                                 .send({type: "blah", app: global.newprojectid})
                                 .set("Authorization", "Bearer testuser:" + global.authtoken)
                                 .set('Host', "api.go.prauxy.app");

        expect(res.body.reason).toBe("invalid type")
        expect(res.status).toBe(400);

        done();
    })

    test("it should create a new nodejs container for a user", async (done) => {
        expect(dockerExists('testuser')).toBe(false);

        const res = await request.post("/docker/new")
                                 .send({type: "nodejs", app: global.newprojectid})
                                 .set("Authorization", "Bearer testuser:" + global.authtoken)
                                 .set('Host', "api.go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("complete");

        expect(dockerExists('testuser')).toBe(true);

        done();
    })

    test("it should restart a docker if a user already has one running", async (done) => {
        expect(dockerExists('testuser')).toBe(true);

        const res = await request.post("/docker/new")
                                 .send({type: "nodejs", app: global.newprojectid})
                                 .set("Authorization", "Bearer testuser:" + global.authtoken)
                                 .set('Host', "api.go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("complete");

        expect(dockerExists('testuser')).toBe(true);

        done();
    })

    test("it should fail to join an invalid terminal", async (done) => {
        expect(dockerExists('baduser')).toBe(false);

        socket.emit("join terminal", "baduser", async (data) => {
            expect(data.trim()).toBe("Error: No such container: baduser-prauxygo");
            expect(dockerExists('baduser')).toBe(false);
            done();
        })       
    })

    test("it should connect to a terminal group and return directory contents", async (done) => {
        expect(dockerExists('testuser')).toBe(true);

        socket.emit("join terminal", "testuser", async (data) => {
            expect(data).not.toBe(undefined);
            expect(dockerExists('testuser')).toBe(true);
            done();
        })       
    })

    test("it should return the docker start logs", async (done) => {
        expect(dockerExists('testuser')).toBe(true);

        socket.on("new logs", (data) => {
            expect(data).not.toBe(undefined);
            expect(dockerExists('testuser')).toBe(true);
            done();
        })       
    })

    test("it should kill the docker container when they leave", async (done) => {
        expect(dockerExists('testuser')).toBe(true);

        socket.emit("kill terminal", "testuser", () => {
            expect(dockerExists('testuser')).toBe(false);
            done();
        });
    })
}