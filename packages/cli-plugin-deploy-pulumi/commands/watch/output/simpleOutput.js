const os = require("os");
const logUpdate = require("log-update");
const { green, yellow, gray, bold, red } = require("chalk");

const EOL = os.EOL;
const HL = EOL + bold(gray("—")).repeat(62) + EOL;

const SECONDS_STILL_DEPLOYING_MESSAGE = 15;
const SECONDS_LONGER_THAN_EXPECTED_MESSAGE = 40;

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
    }

    log({ message, type }) {
        message = message.trim().replace(/^\s+|\s+$/g, "");
        if (!message) {
            return;
        }

        // If only printing logs of a single log type, we don't need to do
        // anything special. Just printing them via `console.log` is enough.
        if (this.usesSingleLogType) {
            console.log(message);
            return;
        }

        if (type === "build" || type === "logs") {
            this.logs.push(message);
            this.printToConsole();
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
                this.deployment.logs.push(message);
        }
    }

    printToConsole() {
        let update = "";
        update += this.logs.join(EOL);
        update += HL;
        update += this.deployment.status;

        logUpdate(update);
    }

    startDeploying() {
        this.deployment.logs = [];
        this.deployment.startedOn = Date.now();

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

            this.deployment.status = yellow(
                "‣ " + deployDuration + `s ‣ ${message}` + ".".repeat(dotsCount)
            );

            this.printToConsole();

            dotsCount++;
        }, 500);
    }

    stopDeploying({ error } = {}) {
        const duration = this.getDeploymentDuration();

        if (error) {
            this.deployment.status = red("‣ " + duration + "s ‣ Deployment failed.");
            this.logs.push("", red("Deployment failed."), ...this.deployment.logs);
        } else {
            this.deployment.logs.push("Deployment finished.");
            this.deployment.status = green("‣ " + duration + "s ‣ Deployment successful.");
        }

        this.deployment.logs = [];
        if (error) {
            // In case of an error, we add a new line to separate the error message from the upcoming logs.
            this.deployment.logs = [""];
        }

        this.deployment.startedOn = null;
        clearInterval(this.deployment.statusUpdateInterval);

        this.printToConsole();
    }

    getDeploymentDuration() {
        return Math.round((Date.now() - this.deployment.startedOn) / 1000);
    }
}

module.exports = new SimpleOutput();
