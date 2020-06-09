module.exports.tests = (request, injectedJS) => {
    test("it shouldn't allow an unauthorized user to view /prauxyapi endpoint of an app they do not have access to", async (done) => {
        const res = await request.get("/prauxyapi")
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.newprojectid + ".go.prauxy.app");

        expect(res.status).toBe(401);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("you do not have access");

        done();
    })

    test("it should allow an authorized user to view /prauxyapi endpoint of an app they do have access to", async (done) => {
        const res = await request.get("/prauxyapi")
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);

        done();
    })

    test("it should deny updates when file includes path traversal", async (done) => {
        const res = await request.post("/prauxyapi/update")
                                 .send({file: "../hello.txt", contents: "Hello world! (but updated)"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(400);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("invalid params");

        done();
    })

    test("it should deny updates to files that don't exist", async (done) => {
        const res = await request.post("/prauxyapi/update")
                                 .send({file: "hellos.txt", contents: "Hello world! (but updated again)"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(400);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("invalid file");

        done();
    })

    test("it should update files when properly requested", async (done) => {
        const res = await request.post("/prauxyapi/update")
                                 .send({file: "hello.txt", contents: "Hello world! (but updated)"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("complete");

        done();
    })

    test("it should redirect / to /index.html", async (done) => {
        const res = await request.get("/")
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.text).not.toBe(undefined);

        done();
    })

    test("it should inject JS into HTML files", async (done) => {
        const res = await request.get("/")
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.text).toBe(`<html><head>${injectedJS}\n<title>Hello World</title>\n</head>\n<body>\n<p>Hello World</p>\n</body></html>`);

        done();
    })

    test("it should not inject JS into non-HTML files", async (done) => {
        const res = await request.get("/hello.txt")
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.text).toBe(`Hello world! (but updated)`);

        done();
    })

    test("it should 404 files that don't exist", async (done) => {
        const res = await request.get("/hellozs.mf1234")
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(404);
        expect(res.text).toBe(`404 file not found`);

        done();
    })
}