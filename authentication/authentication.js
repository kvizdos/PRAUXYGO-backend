const bcrypt = require('bcrypt');
const saltRounds = 10;
const Roles = require("./roles");
const express = require("express");
const fs = require('fs');
const path = require('path');

class Authenticator {
    constructor(mongo) {
        this.mongo = mongo;
        this.routes = express.Router();
        this.registerRoutes(this.routes)
        this.roles = new Roles.Roles();
    }

    getRoutes() { return this.routes }

    createToken(length = 180, arr, delim = "") {
        const options = arr == undefined ? "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-=!@#$%^^&*()_+,.<>?[]" : arr;
        return [...new Array(length)].map(i => options[Math.floor(Math.random() * options.length)]).join(delim);
    }

    async verifyToken(req) {
        if(!/Bearer\s((.{1,})\:(.{180}))/.test(req.get("authorization"))) return {status: "fail", reason: "invalid authorization header"}

        const Bearer = req.get('authorization').split(" ")[1];
        const [username, token] = [Bearer.substring(0, Bearer.lastIndexOf(":")), Bearer.substring(Bearer.lastIndexOf(":") + 1)]
        
        let isValidHeader = await this.mongo.find("users", {username: username, token: token})

        if(isValidHeader.length == 0) return {status: "fail", reason: "invalid authorization header"};

        isValidHeader = isValidHeader[0];

        return isValidHeader;
    }

    hasFeatureFlag(flag, matches) {
        return async (req, res, next) => {
            const isValidToken = await this.verifyToken(req);

            if(isValidToken.status == "fail") return res.status(401).json(isValidToken);

            const userPermissions = this.roles.getRolePerms(isValidToken.plan)

            if(flag != undefined) {
                if((matches != undefined && userPermissions[flag] == matches) || (flag != "projectCap" ? userPermissions[flag] == true : (userPermissions[flag] == -1 || userPermissions[flag] > isValidToken.projects.length))) {
                    next();
                } else {
                    return res.status(401).send({status: "fail", reason: (flag != "projectCap" ? "no permission" : "exceeded project cap")})
                }
            } else {
                next();
            }
        }
    }

    canViewApp() {
        return async (req, res, next) => {
            const isValidToken = await this.verifyToken(req);

            if(isValidToken.status == "fail") return res.status(401).json(isValidToken);

            const app = req.hostname.split(".")[0];

            if(isValidToken.projects.findIndex(i => i.id == app) != -1) {
                req.username = isValidToken.username;
                next();
            } else {
                res.status(401).json({status: "fail", reason: "you do not have access"})
            }
        }
    }

    registerRoutes(app) {
        app.get("/", (req, res) => {
            res.json({status: "up"})
        })

        app.post("/test/verifyToken", this.hasFeatureFlag("terminal"), (req, res) => {
            res.status(200).json({pass: true});
        })

        app.post("/login", async (req, res) => {
            const username = req.body.username,
                  password = req.body.password;
            
            if(username == undefined || password == undefined) return res.status(400).json({authenticated: false, reason: "invalid params"})
            
            try {
                let t = await this.mongo.find("users", {username: username})

                if(t.length > 0) {
                    t = t[0];
                    bcrypt.compare(password, t.password, (err, result) => {
                        if(result) {
                            // TODO: add reset token
                            res.status(200).json({authenticated: true, token: t.token, projects: t.projects, permissions: this.roles.getRolePerms(t.plan)})
                        } else {
                            res.status(401).json({authenticated: false, reason: "invalid password"})
                        }
                    })
                } else {
                    res.status(401).json({authenticated: false, reason: "invalid username"})
                }
            } catch(e) {
                console.log(e);
            }
        });

        app.post("/register", async (req, res) => {
            const username    = req.body.username,
                  password    = req.body.password,
                  email       = req.body.email,
                  name        = req.body.name,
                  org         = req.body.org || "Unspecified",
                  mailinglist = req.body.mailinglist,
                  plan        = req.body.plan || "pro";
            
            if(username == undefined || name == undefined || password == undefined || email == undefined) return res.status(400).json({registered: false, reason: "invalid params"})

            let t = await this.mongo.find("users", {$or: [ { username: username}, { email: email } ]});
            if(t.length == 0) {
                    bcrypt.genSalt(saltRounds, async (err, salt) => {
                        bcrypt.hash(password, salt, async (err, hash) => {
                            try {
                                let token = this.createToken();

                                fs.mkdirSync(path.join(__dirname, '..', 'data', username));    

                                let endDate = new Date();
                                endDate.setDate(endDate.getDate() + 7);

                                endDate = plan == "pro" ? endDate : -1;
                                res.status(200).json({registered: true, plan: plan, endDate: endDate, token: token});

                                await this.mongo.insert("users", { username: username, org: org, mailinglist: mailinglist, projects: [], password: hash, email: email, token: token, plan: plan, freeEndsOn: endDate, hasUpgraded: false});
                            
                            } catch(e) {
                                console.log(e)
                                res.status(500).json({registered: false, reason: "unknown"})
                                throw e;
                            }
                        })
                    })
            } else {
                if(t.length == 2) return res.status(409).json({registered: false, reason: "username and email already taken"});
                if(t.length == 1) return res.status(409).json({registered: false, reason: t[0].email == email && t[0].username == username ? "username and email already taken" : t[0].email == email ? "email taken" : "username taken"})
            }
        })

        app.post("/verify", async (req, res) => {
            const username = req.body.username,
                  token = req.body.token;

            if(username == undefined || token == undefined) return res.status(400).json({verified: false, reason: "invalid params"})
            
            let t = await this.mongo.find("users", {username: username, token: token});
            if(t.length > 0) {
                t = t[0]
                let verification = {verified: true, permissions: this.roles.getRolePerms(t.plan), projects: t.projects};


                if(t.hasUpgraded != true) {
                    if(t.freeEndsOn - (+ new Date()) > 0) {
                        verification.trial = {
                            timeLeft: t.freeEndsOn - (+ new Date())
                        }
                    } else if(t.hasSeenTrialExpire == undefined || t.hasSeenTrialExpire == false) {
                        verification.trial = {
                            ended: true
                        }

                        verification.permissions = this.roles.getRolePerms("free")

                        this.mongo.update("users", {username: username, token: token}, {$set: { hasSeenTrialExpire: true, plan: "free" }})
                    }
                }

                return res.status(200).json(verification);
            } else {
                return res.status(409).json({verified: false, reason: "incorrect token"});
            }
        })
    }
}

module.exports.Authenticator = Authenticator;