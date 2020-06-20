const { matchDocker, dockerExists } = require('../helpers/docker');
const { execSync } = require("child_process");

class Docker {
    constructor(dataDir = "/home/kvizdos/PrauxyGO/PRAUXYGO-backend/data") {
        this.enabledTypes = ["nodejs"]
        this.dataDir = dataDir;
    }

    async createDocker(username, app, type) {
        console.log(`PRAUXYGO DATA DIR: ${this.dataDir}/${username}/${app}`)
        const cmd = `docker run --name=${username}-prauxygo -t -d -v ${this.dataDir}/${username}/${app}:/app prauxygo-${type}`;
        const cmdResult = execSync(cmd).toString();
        return cmdResult;
    }

    registerRoutes(app, auth) {
        app.post("/docker/new", auth.hasFeatureFlag("terminal"), async (req, res) => {
            const username = req.username;
            const app  = req.body.app;
            const type = req.body.type;

            if(app == undefined) return res.status(400).json({status: "fail", reason: "invalid app name"});
            if(this.enabledTypes.indexOf(type) == -1) return res.status(400).json({status: "fail", reason: "invalid type"})
            if(dockerExists(username)) execSync(`docker kill ${username}-prauxygo && docker rm ${username}-prauxygo`);

            const result = await this.createDocker(username, app, type);

            res.status(200).json({status: "complete", containerID: result})
        })
    }
}

module.exports = Docker;