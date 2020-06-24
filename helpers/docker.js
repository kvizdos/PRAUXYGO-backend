const { execSync, exec } = require("child_process");

const matchDocker = (username) => {
    return new RegExp(`Up.+?${username}-prauxygo`, "g");
}

const exists = (username) => {
    const getDockerStatus = execSync(`docker ps -a | grep '${username}-prauxygo' | grep -v grep | cat`).toString();
    const matches = matchDocker(username).test(getDockerStatus);
    return matches;
}

const killAll = () => {
    const rmAllNode = `docker rm $(docker stop $(docker ps -a -q --filter ancestor=prauxygo-nodejs --format="{{.ID}}"))`
    const nodeKillRes = execSync(rmAllNode);
}

const kill = (username) => {
    const rm = `docker rm $(docker kill ${username}-prauxygo)`
    const nodeKillRes = execSync(rm);
    console.log("resu: " + nodeKillRes)
}

const getLogs = async (username) => {
    return new Promise((resolve, reject) => {
        exec(`docker logs ${username}-prauxygo`, (error, stdout, stderr) => {
            if(error) {
                reject(stderr);
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