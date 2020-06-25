const express = require("express");
const fs = require("fs")
const path = require("path");
const DockerRoute = new (require("../docker/docker"));

class APIHandler {
    constructor(mongo, auth) {
        this.mongo = mongo;
        this.auth = auth;
        this.router = express.Router();
        this.registerRoutes(this.router)
        this.nameOpts = "agreeable loaf tent flowery grandfather heap ear deranged deafening bone minor powerful precious third subsequent trail aboard bottle absorbed dream unequal steady ratty mate hideous joyous value cows doubt gigantic versed brave picture day fast crawl seat unbecoming sturdy spray womanly pleasant art hissing thirsty credit wail name murky acidic elastic lewd discreet theory calculate zoom brush instinctive mean coil bite mint glossy respect spotty include zip rely announce achiever weigh mine hungry hydrant giraffe bead metal connection impartial volcano squeamish tasteful airplane volatile massive approve blow girls glove squealing halting skinny tightfisted noisy peaceful muscle happy spectacular use disapprove gray harmony front physical sparkling willing flood thought reason basketball workable exuberant gratis pack action notebook order mess up daily somber notice brief stop fly wink godly retire earsplitting hose grandiose bushes teeny-tiny hard soothe equable beg mountainous ducks annoying badge boring labored week excuse call sink well-to-do condemned consist inquisitive futuristic hate tickle structure witty spurious pinch ripe wave close star turkey wrench bouncy concern love abrupt chop responsible boast slow mere flavor bare stocking scared abashed level interest numerous drunk aberrant elite direction wire striped dashing border bell pen tough coordinated pass mind obtainable disastrous actually steam ski ladybug intend calculator strap inexpensive bury applaud ignore needless line bikes voracious bridge fallacious oven educated key hair miscreant dock continue lace cooing wool bruise stupid hook shake nose frighten organic rake impossible harsh straw laughable tender delight bit auspicious fail save past store scribble defiant greedy cobweb innocent snail joke act unfasten jail exclusive industrious wound defective head familiar envious ugly selective closed whispering fairies overconfident fuzzy mask jellyfish muddle squalid cloth early crayon finicky sun grip handsome owe wonderful guarantee science magic likeable drip baseball maid playground festive spoil saw punish object answer trace scattered male rat anger groan pigs cars insidious listen precede jealous crowded pail tempt elegant club fence lunch salt chilly synonymous attach pull erect add thrill basin assorted nice successful faint abortive internal jewel trees historical jagged amused tramp rhythm history classy rustic year hot stare cracker station annoyed chase fish obedient creepy tense weak talented furry bathe bird grade filthy amuck stone cannon pricey run acceptable price open ablaze cake provide helpless unkempt invention squeak trot cemetery drop match better start ten harm soak high belong dare skillful shaky vacation fireman juice capable overjoyed warn spark stream exciting languid disturbed count voiceless raise circle purple snatch supreme stimulating ruddy domineering angry callous sense mature unarmed jeans flight birds yielding hat guess nonchalant cactus picayune cattle dust dangerous true serve brash push nimble damaged addition wonder stew manage cushion deceive sister feeble aback strip needle machine uncovered doctor man adjoining bow complain sock mark present steadfast flock secretive lumber cautious whistle arm position mellow bubble acoustic imperfect full confess monkey form careless easy sleepy charge flippant brother defeated dazzling hole soda fearless kick scare treatment rude careful high-pitched gorgeous spiffy spade lamp thing pizzas horrible big gruesome cable sloppy government concerned useless adhesive".split(" ");

    }
    
    async generateUniqueID(id = this.auth.createToken(3, this.nameOpts, "-"), depth = 0) {
        if(depth == 3) return;
        depth++;
    
        const found = await this.mongo.find("users", { projects: { $elemMatch: { id: id } }});
    
        if(found.length == 0) {
            return id;
        } else {
            return await this.generateUniqueID(authServer.createToken(3, this.nameOpts, "-"))
        }
    }

    getRoutes() { return this.router }

    registerRoutes(app) {
        app.get("/", (req, res) => {
            res.json({done: true})
        })

        app.post("/projects/new", this.auth.hasFeatureFlag("projectCap"), async (req, res) => {
            const name     = req.body.name,
                  type     = req.body.type;
        
            if(name == undefined || type == undefined) {
                return res.status(400).json({inserted: false, reason: "invalid params"})
            }
        
            const Bearer = req.get('authorization').split(" ")[1];
            const username = Bearer.substring(0, Bearer.lastIndexOf(":"));
        
            const id = await this.generateUniqueID();
            
            await this.mongo.update("users", {username: username}, { $push: { projects: { name: name, type: type, id: id } } });
        
            fs.mkdirSync(path.join(__dirname, '..', 'data', username, id));   
            
            switch(type) {
                case "static":
                    fs.writeFileSync(path.join(__dirname, '..', 'data', username, id, 'index.html'), `<html>\n<head>\n<title>Template file</title>\n</head>\n<body>\n<p>Hello, this is a template file.</p>\n</body>\n</html>`)
                    res.json({inserted: true, id: id})
                    break;
                case "nodejs":
                    console.log("MAKING NODEJS " + name)
                    fs.writeFile(path.join(__dirname, '..', 'data', username, id, 'index.js'), `console.log("Hello world")`, () => {
                        fs.writeFile(path.join(__dirname, '..', 'data', username, id, 'package.json'), `{
    "name": "${name.toLowerCase().replace(/\s/gm, "-")}",
    "description": "",
    "version": "1.0.0",
    "main": "index.js",
    "scripts": {
      "test": "echo \\"Error: no test specified\\" && exit 1"
    },
    "keywords": [],
    "author": "${username}",
    "license": "ISC"
}`, () => {
    res.json({inserted: true, id: id})
})

                    })
                    break;
            }

        });

        DockerRoute.registerRoutes(app, this.auth);
    }
}

module.exports.APIHandler = APIHandler;