import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import { type DeployApp } from "~/abstractions/features/DeployApp.js";

export interface IApiBeforeDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const ApiBeforeDeploy = createAbstraction<IApiBeforeDeploy>("ApiBeforeDeploy");

export namespace ApiBeforeDeploy {
    export type Interface = IApiBeforeDeploy;
    export type Params = DeployApp.Params;
}
