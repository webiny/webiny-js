import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import { type DeployApp } from "~/abstractions/features/DeployApp.js";

export interface IAdminBeforeDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const AdminBeforeDeploy = createAbstraction<IAdminBeforeDeploy>("AdminBeforeDeploy");

export namespace AdminBeforeDeploy {
    export type Interface = IAdminBeforeDeploy;
    export type Params = DeployApp.Params;
}
