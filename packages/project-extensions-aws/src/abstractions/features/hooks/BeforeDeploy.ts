import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import { type DeployApp } from "~/abstractions/features/DeployApp.js";

export interface IBeforeDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const BeforeDeploy = createAbstraction<IBeforeDeploy>("BeforeDeploy");

export namespace BeforeDeploy {
    export type Interface = IBeforeDeploy;
    export type Params = DeployApp.Params;
}
