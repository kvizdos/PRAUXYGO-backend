const fs = require('fs');
const path = require('path');

module.exports.tests = (request, injectedJS) => {
    test("it should allow a user to create a file", async (done) => {
        const res = await request.post("/prauxyapi/new/file")
                                 .send({file: "hello.txt"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        const res2 = await request.post("/prauxyapi/new/file")
                                 .send({file: "index.html"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("complete");

        expect(res2.status).toBe(200);
        expect(res2.body.status).toBe("complete");

        done();
    })

    test("it should create a directory for a new file if it doesn't already exist", async (done) => {
        const res = await request.post("/prauxyapi/new/file")
                                 .send({file: "test/abc/woah.txt"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");
        
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("complete");

        done();
    })

    test("it should place files that start with / in the root project directory", async (done) => {
        const res = await request.post("/prauxyapi/new/file")
                                 .send({file: "/thisbetterberight.txt"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");
        
        const fileExists = fs.existsSync(path.join(__dirname, '..', 'data', 'testfreeuser', global.secondprojectid, 'thisbetterberight.txt'));

        expect(fileExists).toBe(true)

        done();
    })

    test("it should catch missing params when creating a file", async (done) => {
        const res = await request.post("/prauxyapi/new/file")
                                 .send({})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(400);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("invalid params")

        done();
    })

    test("it should require a . in the file name", async (done) => {
        const res = await request.post("/prauxyapi/new/file")
                                 .send({file: "blah"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(400);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("file must contain a period")

        done();
    })

    test("it shouldn't allow for creation of duplicate files", async (done) => {
        const res = await request.post("/prauxyapi/new/file")
                                 .send({file: "hello.txt"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(409);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("file exists")

        done();
    })

    test("it shouldn't allow for creation of duplicate files inside of a directory", async (done) => {
        const res = await request.post("/prauxyapi/new/file")
                                 .send({file: "test/abc/woah.txt"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(409);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("file exists")

        done();
    })

    test("it shouldn't allow for creation of files with path traversal in the name", async (done) => {
        const res = await request.post("/prauxyapi/new/file")
                                 .send({file: "../hello.txt"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(400);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("file name cannot contain traversal")

        done();
    })

    test("it shouldn't an unauthorized user to create a new file", async (done) => {
        const res = await request.post("/prauxyapi/new/file")
                                 .send({file: "hello.txt"})
                                 .set("Authorization", "Bearer testuser:" + global.authtoken)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(401);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("you do not have access")

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

    test("it should allow for creation of folders", async (done) => {
        const folderExistsPre = fs.existsSync(path.join(__dirname, '..', 'data', 'testfreeuser', global.secondprojectid, 'testfolders'));
        expect(folderExistsPre).toBe(false);

        const res = await request.post("/prauxyapi/new/folder")
                                 .send({file: "testfolders"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("complete");

        const folderExistsPost = fs.existsSync(path.join(__dirname, '..', 'data', 'testfreeuser', global.secondprojectid, 'testfolders'));
        expect(folderExistsPost).toBe(true);

        done();
    })

    test("it should allow for creation of nested folders", async (done) => {
        const res = await request.post("/prauxyapi/new/folder")
                                 .send({file: "testfolders/wow"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        const folderExists = fs.existsSync(path.join(__dirname, '..', 'data', 'testfreeuser', global.secondprojectid, 'testfolders', 'wow'));

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("complete");

        expect(folderExists).toBe(true);

        done();
    })

    test("it shouldn't allow for creation of duplicate folders", async (done) => {
        const res = await request.post("/prauxyapi/new/folder")
                                 .send({file: "testfolders"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(409);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("folder exists")

        done();
    })

    test("it should place files that start with / in the root project directory", async (done) => {
        const res = await request.post("/prauxyapi/new/folder")
                                 .send({file: "/testroot"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");
        
        const fileExists = fs.existsSync(path.join(__dirname, '..', 'data', 'testfreeuser', global.secondprojectid, 'testroot'));
        
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("complete");

        expect(fileExists).toBe(true)

        done();
    })

    test("it should catch missing params when creating a folder", async (done) => {
        const res = await request.post("/prauxyapi/new/folder")
                                 .send({})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(400);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("invalid params")

        done();
    })

    test("it shouldn't allow a . in the folder name", async (done) => {
        const res = await request.post("/prauxyapi/new/folder")
                                 .send({file: "blah.notafolder"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(400);
        expect(res.body.status).toBe("fail");
        expect(res.body.reason).toBe("folder cannot contain a period")

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

        const res2 = await request.post("/prauxyapi/update")
                                 .send({file: "index.html", contents: "<html>\n<head>\n<title>Hello World</title>\n</head>\n<body>\n<p>Hello World</p>\n</body></html>"})
                                 .set("Authorization", "Bearer testfreeuser:" + global.authtoken2)
                                 .set('Host', global.secondprojectid + ".go.prauxy.app");

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("complete");

        expect(res2.status).toBe(200);
        expect(res2.body.status).toBe("complete");

        done();
    })
    
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
        expect(res.body).toHaveLength(6);

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