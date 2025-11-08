import { Abstraction } from "@webiny/di";
import { type DeployApp } from "~/abstractions/index.js";

export interface ICoreBeforeDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const CoreBeforeDeploy = new Abstraction<ICoreBeforeDeploy>("CoreBeforeDeploy");

export namespace CoreBeforeDeploy {
    export type Interface = ICoreBeforeDeploy;
    export type Params = DeployApp.Params;
}
