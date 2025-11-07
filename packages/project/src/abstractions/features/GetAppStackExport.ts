import { Abstraction } from "@webiny/di";
import { type IBaseAppParams } from "~/abstractions/types.js";
import { type IPulumiGetStackExportServiceParams } from "~/abstractions/services/PulumiGetStackExportService.js";

export type IGetAppStackExportParams = IBaseAppParams;

export interface IStackExport {
    [key: string]: any;
}

export type IGetAppStackExportResult<TExport extends IStackExport = IStackExport> = TExport | null;

export interface IGetAppStackExport {
    execute<TExport extends IStackExport = IStackExport>(
        params: IPulumiGetStackExportServiceParams
    ): Promise<IGetAppStackExportResult<TExport>>;
}

export const GetAppStackExport = new Abstraction<IGetAppStackExport>("GetAppStackExport");

export namespace GetAppStackExport {
    export type Interface = IGetAppStackExport;

    export type Params = IGetAppStackExportParams;
    export type Result = IGetAppStackExportResult;
    export type StackExport = IStackExport;
}
