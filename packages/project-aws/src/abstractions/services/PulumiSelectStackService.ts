import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import { type IAppModel } from "@webiny/project/abstractions/models/IAppModel.js";

export type IDeployParams = Record<string, never>;

export interface IPulumiSelectStackService {
    execute(app: IAppModel, params?: IDeployParams): Promise<void>;
}

export const PulumiSelectStackService = createAbstraction<IPulumiSelectStackService>(
    "PulumiSelectStackService"
);

export namespace PulumiSelectStackService {
    export type Interface = IPulumiSelectStackService;
    export type Params = IDeployParams;
}
