import { measureDuration } from "~/features/utils/index.js";
import { BaseDeployOutput } from "./BaseDeployOutput.js";
import { PulumiError } from "@webiny/pulumi-sdk";

export class WithDeploymentLogsDeployOutput extends BaseDeployOutput {
    public override async output() {
        const deployProcess = this.deployProcess;
        const ui = this.ui;
        const stdio = this.stdio;
        const params = this.deployParams;

        const isPreview = !!params.preview;

        const getDeploymentDuration = measureDuration();

        try {
            if (isPreview) {
                ui.info(`Previewing deployment for %s app...`, params.app);
            } else {
                ui.info(`Deploying %s app...`, params.app);
            }

            ui.emptyLine();

            this.deployProcess.stdout!.pipe(stdio.getStdout());
            this.deployProcess.stderr!.pipe(stdio.getStderr());
            await deployProcess;

            if (isPreview) {
                ui.success(`Preview completed in ${getDeploymentDuration()}.`);
            } else {
                ui.success(`Deployed in ${getDeploymentDuration()}.`);
            }
        } catch (e) {
            // If Pulumi error, we don't need to show the error message, as it will be shown by Pulumi.
            if (e instanceof PulumiError) {
                // Do nothing.
            } else {
                ui.text(e.message);
            }

            if (isPreview) {
                ui.error("Preview failed, please check the details above.");
            } else {
                ui.error("Deployment failed, please check the details above.");
            }

            throw e;
        }
    }
}
