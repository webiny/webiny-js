import { measureDuration } from "~/features/utils/index.js";
import { BaseDeployOutput } from "./BaseDeployOutput.js";
import ora from "ora";

const SPINNER_MESSAGES: [number, string][] = [
    [60, "Still deploying..."],
    [120, "Still deploying, please wait..."],
    [180, "Some resources take some time to become ready, please wait..."],

    [270, "Still deploying, please don't interrupt..."],
    [360, "Still deploying, please be patient..."],
    [450, "Still deploying, please don't interrupt..."],
    [540, "Still deploying, please be patient..."],

    [600, "Deploying for 10 minutes now, probably a couple more to go..."],
    [720, "Still deploying, shouldn't be much longer now..."],

    [840, "Looks like it's taking a bit longer than usual, please wait..."],
    [900, "Deploying for 15 minutes now, hopefully it's almost done..."],

    [1200, "Deploying for 20 minutes now, hopefully it's almost done..."]
];

export class NoDeploymentLogsDeployOutput extends BaseDeployOutput {
    public override async output() {
        const deployProcess = this.deployProcess;
        const ui = this.ui;
        const params = this.deployParams;

        const isPreview = !!params.preview;

        const getDeploymentDuration = measureDuration();

        const spinner = ora(isPreview ? "Previewing deployment..." : "Deploying...");

        // When showing spinner, we want to show a few messages to the user.
        // The deployment process can take in some cases 10-15 minutes, so we want to
        // give the user some feedback.
        const spinnerMessagesTimeouts = SPINNER_MESSAGES.map(([seconds, message]) => {
            return setTimeout(() => {
                spinner.text = message;
            }, seconds * 1000);
        });

        // Every second, let's add a dot to the end of the message.
        // Once we reach three dots, we start over.
        const threeDotsInterval = setInterval(() => {
            const spinnerText = spinner.text;
            if (spinnerText.endsWith("...")) {
                spinner.text = spinnerText.substring(0, spinnerText.length - 3);
            } else {
                spinner.text = spinnerText + ".";
            }
        }, 1000);

        try {
            spinner.start();
            await deployProcess;

            if (isPreview) {
                spinner.succeed(`Preview completed in ${getDeploymentDuration()}.`);
            } else {
                spinner.succeed(`Deployed in ${getDeploymentDuration()}.`);
            }
        } catch (e) {
            if (isPreview) {
                spinner.fail("Preview failed.");
                ui.emptyLine();
                ui.text(e.message);
                ui.error("Preview failed, please check the details above.");
            } else {
                spinner.fail("Deployment failed.");
                ui.emptyLine();
                ui.text(e.message);
                ui.error("Deployment failed, please check the details above.");
            }

            throw e;
        } finally {
            spinnerMessagesTimeouts.forEach(clearTimeout);
            clearInterval(threeDotsInterval);
        }
    }
}
