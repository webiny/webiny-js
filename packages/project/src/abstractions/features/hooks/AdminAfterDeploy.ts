import { Abstraction } from "@webiny/di";
import { type DeployApp } from "~/abstractions/index.js";

export interface IAdminAfterDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const AdminAfterDeploy = new Abstraction<IAdminAfterDeploy>("AdminAfterDeploy");

export namespace AdminAfterDeploy {
    export type Interface = IAdminAfterDeploy;
    export type Params = DeployApp.Params;
}
