import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IAppModel } from "~/abstractions/models/IAppModel.js";

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
