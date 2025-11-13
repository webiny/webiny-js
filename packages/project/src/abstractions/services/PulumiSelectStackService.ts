import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IAppModel } from "~/abstractions/models/IAppModel.js";
import { type IBaseAppParams } from "~/abstractions/types.js";

export type IDeployParams = IBaseAppParams;

export interface IPulumiSelectStackService {
    execute(app: IAppModel, params: Omit<IDeployParams, "app">): Promise<void>;
}

export const PulumiSelectStackService = createAbstraction<IPulumiSelectStackService>(
    "PulumiSelectStackService"
);

export namespace PulumiSelectStackService {
    export type Interface = IPulumiSelectStackService;
    export type Params = IDeployParams;
}
