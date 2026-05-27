import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type AppName } from "~/abstractions/types.js";
import { type IPackagesBuilder } from "~/abstractions/models/index.js";

export interface IBuildAppParams {
    app: AppName;
    deploymentChecks?: boolean;
    analyze?: boolean;
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
