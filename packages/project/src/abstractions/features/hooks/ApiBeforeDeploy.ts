import { Abstraction } from "@webiny/di";
import { type DeployApp } from "~/abstractions/index.js";

export interface IApiBeforeDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const ApiBeforeDeploy = new Abstraction<IApiBeforeDeploy>("ApiBeforeDeploy");

export namespace ApiBeforeDeploy {
    export type Interface = IApiBeforeDeploy;
    export type Params = DeployApp.Params;
}
