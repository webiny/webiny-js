const os = require("os");
const logUpdate = require("log-update");
const { green, yellow, gray } = require("chalk");

let logs = [yellow("Initializing...")];
let deployment = gray("Waiting for code changes to deploy...");

let deployingInterval;

const EOL = os.EOL;
const HL = EOL + "—".repeat(50) + EOL;

const log = () => logUpdate([logs.join(EOL) + HL + deployment].join());

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
        message = message.trim().replace(/^\s+|\s+$/g, "");
        if (!message) {
            return;
        }

        if (type === "build") {
            logs.push(message);
        }

        if (type === "logs") {
            logs.push(message);
        }

        if (type === "deploy") {
            if (message.includes("Updating...")) {
                startDeploying();
            }

            if (message.includes("Update complete.")) {
                stopDeploying();
            }
        }

        log();
    }
};
