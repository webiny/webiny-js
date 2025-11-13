import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type DeployApp } from "~/abstractions/index.js";

export interface IAdminAfterDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const AdminAfterDeploy = createAbstraction<IAdminAfterDeploy>("AdminAfterDeploy");

export namespace AdminAfterDeploy {
    export type Interface = IAdminAfterDeploy;
    export type Params = DeployApp.Params;
}
