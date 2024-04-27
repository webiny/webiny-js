const os = require("os");
const logUpdate = require("log-update");
const { green, yellow, gray, bold, red } = require("chalk");

const EOL = os.EOL;
const HL = EOL + bold(gray("—")).repeat(62) + EOL;

const SECONDS_STILL_DEPLOYING_MESSAGE = 15;
const SECONDS_LONGER_THAN_EXPECTED_MESSAGE = 40;

class Log {
    constructor(message = "", createdOn = new Date()) {
        this.message = message;
        this.createdOn = createdOn;
    }
}

class SimpleOutput {
    constructor() {
        this.logs = [];
        this.usesSingleLogType = false;

        this.deployment = {
            status: gray("Automatic re-deployments enabled. Watching for code changes..."),
            statusUpdateInterval: null,
            startedOn: null,

            // We only print current deployment-related logs in case of an error.
            logs: []
        };
    }

    initialize(args) {
        this.usesSingleLogType = !!args.build + !!args.deploy + !!args.remoteRuntimeLogs === 1;
        this.showTimestamps = args.showTimestamps;
    }

    log({ message, type }) {
        message = message.trim().replace(/^\s+|\s+$/g, "");
        if (!message) {
            return;
        }

        // If only printing logs of a single log type, we don't need to do
        // anything special. Just printing them via `console.log` is enough.
        if (this.usesSingleLogType) {
            if (this.showTimestamps) {
                message = this.getTimestamp(new Date()) + " " + message;
            }
            console.log(message);
            return;
        }

        if (type === "build" || type === "logs") {
            this.logs.push(new Log(message));
            this.printLogs();
            return;
        }

        // Here we're dealing with deployment logs.
        switch (true) {
            case message.includes("Updating..."): {
                this.startDeploying();
                break;
            }
            case message.includes("Update complete."): {
                this.stopDeploying();
                break;
            }
            case message.includes("Update failed."): {
                this.stopDeploying({ error: true });
                break;
            }
            default:
                this.deployment.logs.push(new Log(message));
        }
    }

    printLogs() {
        let update = this.logs
            .map(log => {
                let message = log.message;
                if (this.showTimestamps) {
                    let timestamp = this.getTimestamp(log.createdOn);
                    message = `${gray(timestamp)} ${message}`;
                }
                return message;
            })
            .join(EOL);

        update += HL;
        update += this.deployment.status;

        logUpdate(update);
    }

    startDeploying() {
        this.deployment.logs = [];
        this.deployment.startedOn = new Date();

        let dotsCount = 3;
        this.deployment.statusUpdateInterval = setInterval(() => {
            if (dotsCount > 3) {
                dotsCount = 0;
            }

            const deployDuration = this.getDeploymentDuration();

            let message = "Deploying";
            if (deployDuration > SECONDS_STILL_DEPLOYING_MESSAGE) {
                message = "Still deploying";
            }

            if (deployDuration > SECONDS_LONGER_THAN_EXPECTED_MESSAGE) {
                message = "Deployment taking longer than expected, hold on";
            }

            let deploymentStatus = yellow(
                "‣ " + deployDuration + `s ‣ ${message}` + ".".repeat(dotsCount)
            );

            if (this.showTimestamps) {
                deploymentStatus =
                    gray(this.getTimestamp(this.deployment.startedOn)) + " " + deploymentStatus;
            }

            this.deployment.status = deploymentStatus;

            this.printLogs();

            dotsCount++;
        }, 500);
    }

    stopDeploying({ error } = {}) {
        let duration = this.getDeploymentDuration();
        let deploymentStatus = green("‣ " + duration + "s ‣ Deployment successful.");
        if (error) {
            deploymentStatus = red("‣ " + duration + "s ‣ Deployment failed.");
        }

        if (this.showTimestamps) {
            deploymentStatus = gray(this.getTimestamp(new Date())) + " " + deploymentStatus;
        }

        this.deployment.status = deploymentStatus;

        if (error) {
            this.logs.push(
                new Log("", null),
                new Log(red("Deployment failed.")),
                ...this.deployment.logs
            );
        } else {
            this.deployment.logs.push(new Log("Deployment finished."));
        }

        this.deployment.logs = [];
        if (error) {
            // In case of an error, we add a new line to separate the error message from the upcoming logs.
            this.deployment.logs = [new Log()];
        }

        this.deployment.startedOn = null;
        clearInterval(this.deployment.statusUpdateInterval);

        this.printLogs();
    }

    getDeploymentDuration() {
        return Math.round((new Date() - this.deployment.startedOn) / 1000);
    }

    getTimestamp(date) {
        return date ? date.toISOString().substr(11, 8) : this.getEmptyTimestampSpace();
    }

    getEmptyTimestampSpace() {
        return " ".repeat(8);
    }
}

module.exports = new SimpleOutput();
