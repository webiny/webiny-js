import { Abstraction } from "@webiny/di";
import { type DeployApp } from "~/abstractions/index.js";

export interface IAfterDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const AfterDeploy = new Abstraction<IAfterDeploy>("AfterDeploy");

export namespace AfterDeploy {
    export type Interface = IAfterDeploy;
    export type Params = DeployApp.Params;
}
