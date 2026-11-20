import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import { type DeployApp } from "~/abstractions/features/DeployApp.js";

export interface IApiAfterDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const ApiAfterDeploy = createAbstraction<IApiAfterDeploy>("ApiAfterDeploy");

export namespace ApiAfterDeploy {
    export type Interface = IApiAfterDeploy;
    export type Params = DeployApp.Params;
}
