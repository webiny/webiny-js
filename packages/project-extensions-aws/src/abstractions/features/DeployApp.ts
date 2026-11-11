import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import { type AppName } from "@webiny/project/abstractions/types.js";
import { type PulumiProcess } from "~/abstractions/features/pulumi/pulumiTypes.js";

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

/*
 * `DeployApp` lives here rather than in `@webiny/project-aws` with the other deploy abstractions
 * because the deploy hooks, which `webiny/infra` exports, take `DeployApp.Params`.
 */
export const DeployApp = createAbstraction<IDeployApp>("DeployApp");

export namespace DeployApp {
    export type Interface = IDeployApp;

    export type Params = IDeployAppParams;

    export type PulumiProcess = IPulumiProcess;
}
