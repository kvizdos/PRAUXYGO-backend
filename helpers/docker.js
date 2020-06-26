/** @module DockerHelper */
const { execSync, exec } = require("child_process");

/**
 * Generates regex to check if a user's docker is running
 * 
 * @param {string} username - Username to find 
 * @returns {RegExp} - Pattern to match
 */
const matchDocker = (username) => {
    return new RegExp(`Up.+?${username}-prauxygo`, "g");
}

/**
 * Compares a username with all Docker containers to see if it exists
 * 
 * @async
 * @param {string} username - Username to find 
 * @returns {Promise<Boolean>} - Returns a promise that resolves to a boolean whether or not it was found.
 */
const exists = async (username) => {
    return new Promise((resolve, reject) => {
        exec(`docker ps -a | grep '${username}-prauxygo' | grep -v grep | cat`, (error, stdout, stderr) => {
            if(error) {
                console.log("ERROR EXISTING: " + stderr);
                return reject(false);
            };

            resolve(matchDocker(username).test(stdout));
        })
    })
}

/**
 * Kills every single Docker container on a machine. Should only be used for limited testing scenarios.
 * 
 * @returns {void}
 */
const killAll = () => {
    const rmAllNode = `docker rm $(docker stop $(docker ps -a -q --filter ancestor=prauxygo-nodejs --format="{{.ID}}"))`
    const nodeKillRes = execSync(rmAllNode);
}

/**
 * Kills and removes a Docker container for a specified user.
 * 
 * @async
 * @param {string} username - Defines the Docker container to destroy. 
 * @returns {Promise<Boolean>} - Returns whether or not the Docker container was killed and removed.
 */
const kill = async (username) => {
    return new Promise((resolve, reject) => {
        exec(`docker rm $(docker kill ${username}-prauxygo)`, (error, stdout, stderr) => {
            if(error) {
                console.log("ERROR KILLING: " + stderr);
                return reject(false);
            };

            resolve(true);
        })
    })
}

/**
 * Gets the logs for a specified Docker container
 * 
 * @async
 * @param {string} username - Defines the Docker container to retrieve logs from
 * @returns {Promise<string>} - Returns logs of a Docker container
 */
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