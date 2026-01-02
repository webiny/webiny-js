import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type AppName } from "~/abstractions/types.js";

export type IGetAppStackExportParams = { app: AppName };

export interface IStackExport {
    [key: string]: any;
}

export type IGetAppStackExportResult<TExport extends IStackExport = IStackExport> = TExport | null;

export interface IGetAppStackExport {
    execute<TExport extends IStackExport = IStackExport>(
        params: IGetAppStackExportParams
    ): Promise<IGetAppStackExportResult<TExport>>;
}

export const GetAppStackExport = createAbstraction<IGetAppStackExport>("GetAppStackExport");

export namespace GetAppStackExport {
    export type Interface = IGetAppStackExport;

    export type Params = IGetAppStackExportParams;
    export type Result = IGetAppStackExportResult;
    export type StackExport = IStackExport;
}
