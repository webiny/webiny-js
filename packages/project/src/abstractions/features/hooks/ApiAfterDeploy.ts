import { Abstraction } from "@webiny/di";
import { type DeployApp } from "~/abstractions/index.js";

export interface IApiAfterDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const ApiAfterDeploy = new Abstraction<IApiAfterDeploy>("ApiAfterDeploy");

export namespace ApiAfterDeploy {
    export type Interface = IApiAfterDeploy;
    export type Params = DeployApp.Params;
}
