import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";
import { type IAppModel } from "@webiny/project/abstractions/models/IAppModel.js";

export interface IPulumiGetStackOutputServiceParams {
    map?: Record<string, any>;
    skipCache?: boolean;
}

export interface IPulumiGetStackOutputService {
    execute<TOutput extends Record<string, any> = Record<string, any>>(
        app: IAppModel,
        params?: IPulumiGetStackOutputServiceParams
    ): Promise<TOutput | null>;
}

export const PulumiGetStackOutputService = createAbstraction<IPulumiGetStackOutputService>(
    "PulumiGetStackOutputService"
);

export namespace PulumiGetStackOutputService {
    export type Interface = IPulumiGetStackOutputService;
    export type Params = IPulumiGetStackOutputServiceParams;
}
