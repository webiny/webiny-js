import { BaseDeployOutput } from "./BaseDeployOutput.js";
import { NoDeploymentLogsDeployOutput } from "./NoDeploymentLogsDeployOutput.js";
import { WithDeploymentLogsDeployOutput } from "./WithDeploymentLogsDeployOutput.js";

export class DeployOutput extends BaseDeployOutput {
    public override async output() {
        const OutputClass = this.getOutputClass();

        const output = new OutputClass({
            deployProcess: this.deployProcess,
            stdio: this.stdio,
            ui: this.ui,
            showDeploymentLogs: this.showDeploymentLogs,
            deployParams: this.deployParams
        });

        return output.output();
    }

    private getOutputClass() {
        if (this.showDeploymentLogs) {
            return WithDeploymentLogsDeployOutput;
        }

        return NoDeploymentLogsDeployOutput;
    }
}
