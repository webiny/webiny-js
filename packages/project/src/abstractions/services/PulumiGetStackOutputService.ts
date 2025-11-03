import { Abstraction } from "@webiny/di";
import { type IAppModel } from "~/abstractions/models/IAppModel.js";
import { type IBaseAppParams } from "~/abstractions/types.js";

export interface IPulumiGetStackOutputServiceParams extends Omit<IBaseAppParams, "app"> {
    map?: Record<string, any>;
}

export interface IPulumiGetStackOutputService {
    execute<TOutput extends Record<string, any> = Record<string, any>>(
        app: IAppModel,
        params: IPulumiGetStackOutputServiceParams
    ): Promise<TOutput | null>;
}

export const PulumiGetStackOutputService = new Abstraction<IPulumiGetStackOutputService>(
    "PulumiGetStackOutputService"
);

export namespace PulumiGetStackOutputService {
    export type Interface = IPulumiGetStackOutputService;
    export type Params = IPulumiGetStackOutputServiceParams;
}
