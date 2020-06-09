const fs = require('fs');
const path = require('path');

module.exports.tests = (request) => {
    test("it should catch missing parameters while creating a new project", async (done) => {
        const res = await request.post("/projects/new")
                                 .send({
                                     name: "Test App",
                                 })
                                 .set("Authorization", "Bearer testuser:" + global.authtoken)
                                 .set('Host', "api.go.prauxy.app");

        expect(res.status).toBe(400);
        expect(res.body.inserted).toBe(false);
        expect(res.body.reason).toBe("invalid params");

        done();
    })

    test("it should create a new project", async (done) => {
        const res = await request.post("/projects/new")
                                 .send({
                                    name: "Test App",
                                    type: "static"
                                 }) 
                                 .set("Authorization", "Bearer testuser:" + global.authtoken)
                                 .set('Host', "api.go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body.inserted).toBe(true);
        expect(res.body).toHaveProperty("id");

        global.newprojectid = res.body.id;

        done();
    })

    test("it should max out at 3 projects on a free plan (featureFlag test)", async (done) => {
        const res = await request.post("/projects/new")
                                 .send({
                                    name: "Test App 1",
                                    type: "static"
                                 }) 
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', "api.go.prauxy.app");

        const res2 = await request.post("/projects/new")
                                 .send({
                                    name: "Test App 2",
                                    type: "static"
                                 }) 
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', "api.go.prauxy.app");
                                 
        const res3 = await request.post("/projects/new")
                                 .send({
                                    name: "Test App 3",
                                    type: "static"
                                 }) 
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', "api.go.prauxy.app");
                                 
        const res4 = await request.post("/projects/new")
                                 .send({
                                    name: "Test App 4",
                                    type: "static"
                                 }) 
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', "api.go.prauxy.app");
        expect(res.status).toBe(200);
        expect(res.body.inserted).toBe(true);
        expect(res.body).toHaveProperty("id");

        expect(res2.status).toBe(200);
        expect(res2.body.inserted).toBe(true);
        expect(res2.body).toHaveProperty("id");
        
        expect(res3.status).toBe(200);
        expect(res3.body.inserted).toBe(true);
        expect(res3.body).toHaveProperty("id");
        
        expect(res4.status).toBe(401);
        expect(res4.body.status).toBe("fail");
        expect(res4.body.reason).toBe("exceeded project cap");

        global.secondprojectid = res.body.id;

        // const baseItem = fs.createWriteStream(path.join(__dirname, '..', 'data', 'testfreeuser', res.body.id, 'index.html'));
        // baseItem.write("<html>\n<head>\n<title>Hello World</title>\n</head>\n<body>\n<p>Hello World</p>\n</body></html>")
        // baseItem.end();

        // const unchangedFile = fs.createWriteStream(path.join(__dirname, '..', 'data', 'testfreeuser', res.body.id, 'hello.txt'));
        // unchangedFile.write("Hello World!")
        // unchangedFile.end();

        done();
    })
}