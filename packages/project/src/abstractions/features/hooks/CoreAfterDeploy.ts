import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type DeployApp } from "~/abstractions/index.js";

export interface ICoreAfterDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const CoreAfterDeploy = createAbstraction<ICoreAfterDeploy>("CoreAfterDeploy");

export namespace CoreAfterDeploy {
    export type Interface = ICoreAfterDeploy;
    export type Params = DeployApp.Params;
}
