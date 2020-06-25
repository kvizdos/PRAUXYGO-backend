const { execSync, exec } = require("child_process");

const matchDocker = (username) => {
    return new RegExp(`Up.+?${username}-prauxygo`, "g");
}

const exists = (username) => {
    return new Promise((resolve, reject) => {
        exec(`docker ps -a | grep '${username}-prauxygo' | grep -v grep | cat`, (error, stdout, stderr) => {
            if(error) {
                console.log("ERRRROROOROROROR: " + stderr);
                return reject(false);
            };

            resolve(matchDocker(username).test(stdout));
        })
    })
}

const killAll = () => {
    const rmAllNode = `docker rm $(docker stop $(docker ps -a -q --filter ancestor=prauxygo-nodejs --format="{{.ID}}"))`
    const nodeKillRes = execSync(rmAllNode);
}

const kill = (username) => {
    const rm = `docker rm $(docker kill ${username}-prauxygo)`
    const nodeKillRes = execSync(rm);
}

const getLogs = async (username) => {
    return new Promise((resolve, reject) => {
        exec(`docker logs ${username}-prauxygo`, (error, stdout, stderr) => {
            if(error) {
                return reject(stderr);
            } 

            resolve(stdout);
        })
    });
}

module.exports.matchDocker = matchDocker;
module.exports.dockerExists = exists;
module.exports.killAll = killAll;
module.exports.kill = kill;
module.exports.getLogs = getLogs;