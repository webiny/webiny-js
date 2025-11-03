import { Abstraction } from "@webiny/di";
import { type DeployApp } from "~/abstractions/index.js";

export interface IBeforeDeploy {
    execute(params: DeployApp.Params): void | Promise<void>;
}

export const BeforeDeploy = new Abstraction<IBeforeDeploy>("BeforeDeploy");

export namespace BeforeDeploy {
    export type Interface = IBeforeDeploy;
    export type Params = DeployApp.Params;
}
