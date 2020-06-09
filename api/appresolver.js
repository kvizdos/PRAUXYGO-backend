const express = require("express");
const path = require("path");
const fs = require("fs")
const cheerio = require("cheerio")

const INJECTEDJAVASCRIPT = `\n<!-- PRAUXYGO DEPENENCY INJECTION, DO NOT TOUCH --><script>window.ReactNativeWebView.postMessage(JSON.stringify({code: document.getElementsByTagName('html')[0].innerHTML})); const _prLOG = console.log, _prWARN = console.warn, _prERROR = console.error; console.log = (m) => { window.ReactNativeWebView.postMessage(JSON.stringify({message: m, type: "log"})); _prLOG(m); return m; }; console.warn = (m) => { window.ReactNativeWebView.postMessage(JSON.stringify({message: m, type: "warn"})); _prWARN(m); return m; }; console.error = (m) => { window.ReactNativeWebView.postMessage(JSON.stringify({message: m, type: "error"})); _prERROR(m); return m; }; this.window.addEventListener("message", (event) => { try { var resp = eval(JSON.parse(event.data).cmd); console.log(typeof resp == "object" ? JSON.stringify(resp) : resp.toString().trim()) } catch(e) { console.error(JSON.stringify(e.message)) }; });window.onerror = (error, url, line) => { console.error(JSON.stringify({type: "errorcaught", error: error, url: [...url.split("/")].slice(3).join("/") || "index.html", line: url.endsWith('.js') ? line += 1 : line})); };window.onabort = (e) => { console.error("Error " + e) };</script>`

const nameOpts = "agreeable loaf tent flowery grandfather heap ear deranged deafening bone minor powerful precious third subsequent trail aboard bottle absorbed dream unequal steady ratty mate hideous joyous value cows doubt gigantic versed brave picture day fast crawl seat unbecoming sturdy spray womanly pleasant art hissing thirsty credit wail name murky acidic elastic lewd discreet theory calculate zoom brush instinctive mean coil bite mint glossy respect spotty include zip rely announce achiever weigh mine hungry hydrant giraffe bead metal connection impartial volcano squeamish tasteful airplane volatile massive approve blow girls glove squealing halting skinny tightfisted noisy peaceful muscle happy spectacular use disapprove gray harmony front physical sparkling willing flood thought reason basketball workable exuberant gratis pack action notebook order mess up daily somber notice brief stop fly wink godly retire earsplitting hose grandiose bushes teeny-tiny hard soothe equable beg mountainous ducks annoying badge boring labored week excuse call sink well-to-do condemned consist inquisitive futuristic hate tickle structure witty spurious pinch ripe wave close star turkey wrench bouncy concern love abrupt chop responsible boast slow mere flavor bare stocking scared abashed level interest numerous drunk aberrant elite direction wire striped dashing border bell pen tough coordinated pass mind obtainable disastrous actually steam ski ladybug intend calculator strap inexpensive bury applaud ignore needless line bikes voracious bridge fallacious oven educated key hair miscreant dock continue lace cooing wool bruise stupid hook shake nose frighten organic rake impossible harsh straw laughable tender delight bit auspicious fail save past store scribble defiant greedy cobweb innocent snail joke act unfasten jail exclusive industrious wound defective head familiar envious ugly selective closed whispering fairies overconfident fuzzy mask jellyfish muddle squalid cloth early crayon finicky sun grip handsome owe wonderful guarantee science magic likeable drip baseball maid playground festive spoil saw punish object answer trace scattered male rat anger groan pigs cars insidious listen precede jealous crowded pail tempt elegant club fence lunch salt chilly synonymous attach pull erect add thrill basin assorted nice successful faint abortive internal jewel trees historical jagged amused tramp rhythm history classy rustic year hot stare cracker station annoyed chase fish obedient creepy tense weak talented furry bathe bird grade filthy amuck stone cannon pricey run acceptable price open ablaze cake provide helpless unkempt invention squeak trot cemetery drop match better start ten harm soak high belong dare skillful shaky vacation fireman juice capable overjoyed warn spark stream exciting languid disturbed count voiceless raise circle purple snatch supreme stimulating ruddy domineering angry callous sense mature unarmed jeans flight birds yielding hat guess nonchalant cactus picayune cattle dust dangerous true serve brash push nimble damaged addition wonder stew manage cushion deceive sister feeble aback strip needle machine uncovered doctor man adjoining bow complain sock mark present steadfast flock secretive lumber cautious whistle arm position mellow bubble acoustic imperfect full confess monkey form careless easy sleepy charge flippant brother defeated dazzling hole soda fearless kick scare treatment rude careful high-pitched gorgeous spiffy spade lamp thing pizzas horrible big gruesome cable sloppy government concerned useless adhesive".split(" ");

class AppResolver {
    constructor(mongo, auth) {
        this.mongo = mongo;
        this.auth = auth;
        this.router = express.Router();
        this.registerRoutes(this.router)
    }
    
    async generateUniqueID(id = this.auth.createToken(3, nameOpts, "-"), depth = 0) {
        if(depth == 3) return;
        depth++;
    
        const found = await this.mongo.find("users", { projects: { $elemMatch: { id: id } }});
    
        if(found.length == 0) {
            return id;
        } else {
            return await generateUniqueID(authServer.createToken(3, nameOpts, "-"))
        }
    }

    readDir(directory, path = "") {
        const files = fs.readdirSync(directory).map(i => {
            return {
                file: path + i,
                contents: i.indexOf(".") >= 0 ? fs.readFileSync(directory + "/" + i, 'utf8') : this.readDir(directory + "/" + i, path + i + "/"),
                type: i.indexOf(".") >= 0 ? "file" : "folder"
            }
        }).sort((a, b) => {
            a = a.type == "file";
            b = b.type == "file";
    
            return a == b ? 0 : a == false ? -1 : 1
        })
    
        return files;
    }

    getRoutes() { return this.router }

    getInjectedJs() {
        return INJECTEDJAVASCRIPT;
    }
    
    registerRoutes(app) {
        app.get("/prauxyapi", this.auth.canViewApp("manage"), async (req, res) => {
            const app = req.hostname.split(".")[0];

            let appInfo = await this.mongo.find("users", {projects: { $elemMatch: { id: app } }});

            if(appInfo.length == 0) {
                return res.status(404).send("Unknown site")
            }

            appInfo = appInfo[0];

            const files = this.readDir(path.join(__dirname, '..', 'data', appInfo.username, app));
        
            res.json(files)
        })

        app.post("/prauxyapi/update", this.auth.canViewApp("manage"), async (req, res) => {
            const app = req.hostname.split(".")[0];
            const file = req.body.file,
                  contents = req.body.contents;

            if(file == "" || file == undefined || file.indexOf("..") >= 0 || contents == undefined) return res.status(400).json({status: "fail", reason: "invalid params"})

            let appInfo = await this.mongo.find("users", {projects: { $elemMatch: { id: app } }});

            if(appInfo.length == 0) {
                return res.status(404).send("Unknown site")
            }
            appInfo = appInfo[0];

            if(fs.existsSync(path.join(__dirname, '..', 'data', appInfo.username, app, file))) {

                fs.writeFileSync(path.join(__dirname, '..', 'data', appInfo.username, app, file), contents);
                
                res.json({status: "complete"})
            } else {
                res.status(400).json({status: "fail", reason: "invalid file"})
            }
        })
        
        app.get("/*", async (req, res) => {
            const app = req.hostname.split(".")[0];

            let appInfo = await this.mongo.find("users", {projects: { $elemMatch: { id: app } }});

            if(appInfo.length == 0) {
                return res.status(404).send("Unknown site")
            }

            appInfo = appInfo[0];

            try {
                const i = req.params[0] || "index.html";
                const data = i.indexOf(".html") >= 0 ? (() => {
                    const html = fs.readFileSync(path.join(__dirname, '..', 'data', appInfo.username, app, i), 'utf8');
                    const $ = cheerio.load(html);
                    $('head').prepend(INJECTEDJAVASCRIPT);
                    return $.html()
                })() : fs.readFileSync(path.join(__dirname, '..', 'data', appInfo.username, app, i), 'utf8');

                res.send(data);
            } catch(e) {
                res.status(404).send("404 file not found");
            }
        })
    }
}

module.exports.AppResolver = AppResolver;