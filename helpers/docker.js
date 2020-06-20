const { execSync } = require("child_process");

const matchDocker = (username) => {
    return new RegExp(`Up.+?${username}-prauxygo`, "g");
}

const exists = (username) => {
    const getDockerStatus = execSync(`docker ps -a | grep '${username}-prauxygo' | grep -v grep | cat`).toString();
    const matches = matchDocker(username).test(getDockerStatus);
    console.log(`Get docker status: ${getDockerStatus}`)
    console.log(`USERNAME IS ${username} and it is ${matches}`);
    return matches;
}

const killAll = () => {
    const rmAllNode = `docker rm $(docker stop $(docker ps -a -q --filter ancestor=prauxygo-nodejs --format="{{.ID}}"))`
    const nodeKillRes = execSync(rmAllNode);
    console.log(nodeKillRes);
}

module.exports.matchDocker = matchDocker;
module.exports.dockerExists = exists;
module.exports.killAll = killAll;