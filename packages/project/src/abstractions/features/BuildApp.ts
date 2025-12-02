import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IBaseAppParams } from "~/abstractions/types.js";
import { type IPackagesBuilder } from "~/abstractions/models/index.js";

export interface IBuildAppParams extends IBaseAppParams {
    deploymentChecks?: boolean;
}

export type IBuildResult = IPackagesBuilder;

export interface IBuildApp {
    execute(params: IBuildAppParams): Promise<IBuildResult>;
}

export const BuildApp = createAbstraction<IBuildApp>("BuildApp");

export namespace BuildApp {
    export type Interface = IBuildApp;

    export type Params = IBuildAppParams;
    export type Result = IBuildResult;
}
