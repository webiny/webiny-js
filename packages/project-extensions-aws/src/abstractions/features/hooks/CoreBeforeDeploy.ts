import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import { type DeployApp } from "~/abstractions/features/DeployApp.js";

export interface ICoreBeforeDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const CoreBeforeDeploy = createAbstraction<ICoreBeforeDeploy>("CoreBeforeDeploy");

export namespace CoreBeforeDeploy {
    export type Interface = ICoreBeforeDeploy;
    export type Params = DeployApp.Params;
}
