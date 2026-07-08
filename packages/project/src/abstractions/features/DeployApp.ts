import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type AppName } from "~/abstractions/types.js";
import { type PulumiProcess } from "@webiny/pulumi-sdk";

type IPulumiProcess = PulumiProcess;

interface IDeployAppParams {
    app: AppName;
    preview?: boolean;
    pulumiArgs?: Record<string, string | boolean | string[] | undefined>;
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
