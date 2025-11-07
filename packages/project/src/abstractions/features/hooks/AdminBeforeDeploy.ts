import { Abstraction } from "@webiny/di";
import { type DeployApp } from "~/abstractions/index.js";

export interface IAdminBeforeDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const AdminBeforeDeploy = new Abstraction<IAdminBeforeDeploy>("AdminBeforeDeploy");

export namespace AdminBeforeDeploy {
    export type Interface = IAdminBeforeDeploy;
    export type Params = DeployApp.Params;
}
