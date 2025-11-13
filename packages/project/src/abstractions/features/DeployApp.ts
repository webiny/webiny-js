import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IBaseAppParams } from "~/abstractions/types.js";
import { type ExecaChildProcess } from "execa";

type IPulumiProcess = ExecaChildProcess<string>;

interface IDeployAppParams extends IBaseAppParams {
    preview?: boolean;
    debug?: boolean;
    dataMigrationLogStreaming?: boolean;
    output?: (pulumiProcess: IPulumiProcess) => Promise<void>;
}

interface IDeployApp {
    execute(params: IDeployAppParams): Promise<void>;
}

export const DeployApp = createAbstraction<IDeployApp>("DeployApp");

export namespace DeployApp {
    export type Interface = IDeployApp;

    export type Params = IDeployAppParams;

    export type PulumiProcess = IPulumiProcess;
}
