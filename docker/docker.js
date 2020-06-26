const { matchDocker, dockerExists, kill } = require('../helpers/docker');
const { exec } = require("child_process");

class Docker {
    /**
     * This class aides in the creation of route registration and other subtasks of Docker which are not specified in ../helpers/docker.js
     * 
     * @constructor
     * @param {string} [dataDir = "/home/kvizdos/PrauxyGO/PRAUXYGO-backend/data"] - Specifies the directory to look into for user data 
     */
    constructor(dataDir = "/home/kvizdos/PrauxyGO/PRAUXYGO-backend/data") {
        this.enabledTypes = ["nodejs"]
        this.dataDir = dataDir;
    }

    /**
     * Creates and starts a Docker container
     * 
     * @async
     * @param {string} username - Container name
     * @param {string} app - PrauxyGO app ID
     * @param {('nodejs' | 'static')} type - Project type
     * @returns {string} Resolves output of docker run
     */
    async createDocker(username, app, type) {
        return new Promise((resolve, reject) => {
            exec(`docker run --name=${username}-prauxygo -t -d -v ${this.dataDir}/${username}/${app}:/app prauxygo-${type}`, (error, stdout, stderr) => {
                if(error) {
                    console.log("ERROR CREATING DOCKER: " + stderr);
                    return reject(stderr);
                };
    
                resolve(stdout);
            })
        })
    }

    /**
     * Generates routes for Docker endpoints
     * 
     * @param {import('express')()} app - Express app to listen on
     * @param {import('../authentication/authentication')} auth - Authentication service for middleware
     */
    registerRoutes(app, auth) {
        app.post("/docker/new", auth.hasFeatureFlag("terminal"), async (req, res) => {
            const username = req.username;
            const app  = req.body.app;
            const type = req.body.type;

            if(app == undefined) return res.status(400).json({status: "fail", reason: "invalid app name"});
            if(this.enabledTypes.indexOf(type) == -1) return res.status(400).json({status: "fail", reason: "invalid type"})
            // if(await dockerExists(username)) execSync(`docker kill ${username}-prauxygo && docker rm ${username}-prauxygo`);
            const dockerAlreadyExists = await dockerExists(username);
            if(dockerAlreadyExists) await kill(username);

            const result = await this.createDocker(username, app, type);

            res.status(200).json({status: "complete", containerID: result})
        })
    }
}

module.exports = Docker;