import { Abstraction } from "@webiny/di-container";
import { type IAppModel } from "~/abstractions/models/IAppModel.js";
import { type IBaseAppParams } from "~/abstractions/types.js";

export type IPulumiGetStackExportServiceParams = Omit<IBaseAppParams, "app">;

export interface IPulumiGetStackExportService {
    execute<TOutput extends Record<string, any> = Record<string, any>>(
        app: IAppModel,
        params: IPulumiGetStackExportServiceParams
    ): Promise<TOutput | null>;
}

export const PulumiGetStackExportService = new Abstraction<IPulumiGetStackExportService>(
    "PulumiGetStackExportService"
);

export namespace PulumiGetStackExportService {
    export type Interface = IPulumiGetStackExportService;
    export type Params = IPulumiGetStackExportServiceParams;
}
