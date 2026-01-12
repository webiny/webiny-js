import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type AppName } from "~/abstractions/types.js";

export type IExportStackParams = { app: AppName };

export interface IStackExport {
    [key: string]: any;
}

export type IExportStackResult<TExport extends IStackExport = IStackExport> = TExport | null;

export interface IExportStack {
    execute<TExport extends IStackExport = IStackExport>(
        params: IExportStackParams
    ): Promise<IExportStackResult<TExport>>;
}

export const ExportStack = createAbstraction<IExportStack>("ExportStack");

export namespace ExportStack {
    export type Interface = IExportStack;

    export type Params = IExportStackParams;
    export type Result = IExportStackResult;
    export type StackExport = IStackExport;
}
