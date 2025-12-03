import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type DeployApp } from "~/abstractions/index.js";

export interface IAdminBeforeDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const AdminBeforeDeploy = createAbstraction<IAdminBeforeDeploy>("AdminBeforeDeploy");

export namespace AdminBeforeDeploy {
    export type Interface = IAdminBeforeDeploy;
    export type Params = DeployApp.Params;
}
