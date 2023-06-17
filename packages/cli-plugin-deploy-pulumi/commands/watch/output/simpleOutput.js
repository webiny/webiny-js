const os = require("os");
const logUpdate = require("log-update");
const { green, yellow, gray } = require("chalk");

let logs = [];
let deployment = gray("Automatic re-deployments enabled. Watching for code changes...");

let deployingInterval;

const EOL = os.EOL;
const HL = EOL + "—".repeat(62) + EOL;

const log = () => {
    let update = "";
    if (logs.length) {
        update += logs.join(EOL);
    }

    update += HL;
    update += deployment;

    logUpdate(update);
};

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
