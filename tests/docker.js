const { dockerExists } = require('../helpers/docker')

module.exports.tests = (request) => {
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
}