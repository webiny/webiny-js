const os = require("os");
const logUpdate = require("log-update");
const { green, yellow, gray, bold, red } = require("chalk");

let logs = [];
let deployment = gray("Automatic re-deployments enabled. Watching for code changes...");

let deployingInterval;

const EOL = os.EOL;
const HL = EOL + bold(gray("—")).repeat(62) + EOL;

const SECONDS_STILL_DEPLOYING_MESSAGE = 12;
const SECONDS_LONGER_THAN_EXPECTED_MESSAGE = 40;

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

let hiddenDeploymentLogs = [];

const startDeploying = () => {
    let dotsCount = 3;
    deployStartedOn = Date.now();
    deployingInterval = setInterval(() => {
        if (dotsCount > 3) {
            dotsCount = 0;
        }

        const deployDuration = getDeployDurationInSeconds();
        let message = "Deploying";
        if (deployDuration > SECONDS_STILL_DEPLOYING_MESSAGE) {
            message = "Still deploying";
        }

        if (deployDuration > SECONDS_LONGER_THAN_EXPECTED_MESSAGE) {
            message = "Deployment taking longer than expected, hold on";
        }

        deployment = yellow("‣ " + deployDuration + `s ‣ ${message}` + ".".repeat(dotsCount));

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

            if (deployStartedOn) {
                hiddenDeploymentLogs.push(message);
            }

            if (message.includes("Update complete.")) {
                hiddenDeploymentLogs = [];
                stopDeploying();
            }

            if (message.includes("Update failed.")) {
                logs.push(hiddenDeploymentLogs.join(EOL));
                deployment = red(
                    "Deployment failed. Please examine the logs above and address any issues before running the watch command again. Exiting..."
                );
                log();
                process.exit(1);

            }
        }

        log();
    }
};
