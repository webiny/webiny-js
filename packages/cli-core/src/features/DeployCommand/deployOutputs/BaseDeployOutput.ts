import { UiService, StdioService } from "~/abstractions/index.js";
import { IDeploySingleAppParams } from "../DeployCommand.js";
import { ExecaChildProcess } from "execa";

export type IDeployProcess = ExecaChildProcess<string>;

export interface IBaseDeployOutputParams {
    deployProcess: IDeployProcess;
    stdio: StdioService.Interface;
    ui: UiService.Interface;
    showDeploymentLogs: boolean;
    deployParams: IDeploySingleAppParams;
}

export class BaseDeployOutput {
    public readonly deployProcess: IDeployProcess;
    public readonly stdio: StdioService.Interface;
    public readonly ui: UiService.Interface;
    public readonly showDeploymentLogs: boolean;
    public readonly deployParams: IDeploySingleAppParams;

    public constructor({
        deployProcess,
        stdio,
        ui,
        showDeploymentLogs,
        deployParams
    }: IBaseDeployOutputParams) {
        this.deployProcess = deployProcess;
        this.stdio = stdio;
        this.ui = ui;
        this.showDeploymentLogs = showDeploymentLogs;
        this.deployParams = deployParams;
    }

    public async output(): Promise<void> {
        throw new Error("Not implemented.");
    }
}
