const os = require("os");
const logUpdate = require("log-update");
const { green, yellow } = require("chalk");

let logs = [];
let deployment = yellow("Waiting for code changes...");

let deployingInterval;

const log = () => logUpdate(logs.join(os.EOL) + os.EOL + os.EOL + '—————————————————————————' + os.EOL + deployment);

let deployStartedOn = null;
const getDeployDurationInSeconds = () => Math.round((Date.now() - deployStartedOn) / 1000);

const startDeploying = () => {
    let dotsCount = 3;
    deployStartedOn = Date.now();
    deployingInterval = setInterval(() => {
        if (dotsCount > 3) {
            dotsCount = 0;
        }

        deployment = yellow(
            "‣ " + getDeployDurationInSeconds() + "s ‣ Deploying" + ".".repeat(dotsCount)
        );

        log();

        dotsCount++;
    }, 500);
};

const stopDeploying = () => {
    clearInterval(deployingInterval);
    deployment = green("‣ " + getDeployDurationInSeconds() + "s ‣ Deployment successful.");
};

module.exports = {
    type: "watch-output",
    name: "watch-output-terminal",
    log({ message, type }) {
        message = message.trim();
        if (!message) {
            return;
        }

        if (type === "deploy") {
            if (message.includes("update aws:")) {
                return;
            }

            if (message.includes("Updating...")) {
                startDeploying();
            }

            if (message.includes("Update complete.")) {
                stopDeploying();
            }
        }

        if (type === "build") {
            logs.push(message);
        }

        if (type === "logs") {
            logs.push(message);
        }

        log();
    }
};
