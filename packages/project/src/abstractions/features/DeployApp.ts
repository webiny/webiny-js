import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type AppName } from "~/abstractions/types.js";
import { type ExecaChildProcess } from "execa";

type IPulumiProcess = ExecaChildProcess<string>;

interface IDeployAppParams {
    app: AppName;
    preview?: boolean;
    debug?: boolean;
    dataMigrationLogStreaming?: boolean;
    allowLocalStateFiles?: boolean;
    output?: (pulumiProcess: IPulumiProcess) => Promise<void>;
}

export interface IDeployApp {
    execute(params: IDeployAppParams): Promise<void>;
}

export const DeployApp = createAbstraction<IDeployApp>("DeployApp");

export namespace DeployApp {
    export type Interface = IDeployApp;

    export type Params = IDeployAppParams;

    export type PulumiProcess = IPulumiProcess;
}
