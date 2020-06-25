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
        const dockerExistsBefore = await dockerExists('testuser');
        expect(dockerExistsBefore).toBe(false);

        const res = await request.post("/docker/new")
                                 .send({type: "nodejs", app: global.newprojectid})
                                 .set("Authorization", "Bearer testuser:" + global.authtoken)
                                 .set('Host', "api.go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("complete");

        const dockerExistsAfter = await dockerExists('testuser');
        expect(dockerExistsAfter).toBe(true);

        done();
    })

    test("it should restart a docker if a user already has one running", async (done) => {
        const dockerExistsBefore = await dockerExists('testuser');
        expect(dockerExistsBefore).toBe(true);

        const res = await request.post("/docker/new")
                                 .send({type: "nodejs", app: global.newprojectid})
                                 .set("Authorization", "Bearer testuser:" + global.authtoken)
                                 .set('Host', "api.go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("complete");

        const dockerExistsAfter = await dockerExists('testuser');
        expect(dockerExistsAfter).toBe(true);

        done();
    })

    test("it should fail to join an invalid terminal", async (done) => {
        const dockerExistsBefore = await dockerExists('baduser');
        expect(dockerExistsBefore).toBe(false);


        socket.emit("join terminal", "baduser", async (data) => {
            expect(data.trim()).toBe("Error: No such container: baduser-prauxygo");

            const dockerExistsAfter = await dockerExists('baduser');
            expect(dockerExistsAfter).toBe(false);
            done();
        })       
    })

    test("it should connect to a terminal group and return initial line plus extra new logs", async (done) => {
        const dockerExistsBefore = await dockerExists('testuser');
        expect(dockerExistsBefore).toBe(true);


        socket.emit("join terminal", "testuser", async (data) => {
            const dockerExistsBefore = await dockerExists('testuser');
            expect(dockerExistsBefore).toBe(true);

            expect(data).not.toBe(undefined);
            console.log("DATAA: " + data);

            socket.on("new logs", async (data) => {
                expect(data).not.toBe(undefined);

                console.log("DATAAAAAA: " + data);

                const dockerExistsAfter = await dockerExists('testuser');
                expect(dockerExistsAfter).toBe(true);
                done();
            })       
        })       
    })

    test("it should kill the docker container when they leave", async (done) => {
        const dockerExistsBefore = await dockerExists('testuser');
        expect(dockerExistsBefore).toBe(true);

        socket.emit("kill terminal", "testuser", async () => {
            const dockerExistsAfter = await dockerExists('testuser');
            expect(dockerExistsAfter).toBe(false);
            done();
        });
    })
}