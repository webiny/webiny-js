import { Abstraction } from "@webiny/di";
import { type DeployApp } from "~/abstractions/index.js";

export interface ICoreAfterDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const CoreAfterDeploy = new Abstraction<ICoreAfterDeploy>("CoreAfterDeploy");

export namespace CoreAfterDeploy {
    export type Interface = ICoreAfterDeploy;
    export type Params = DeployApp.Params;
}
