import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IAppModel } from "~/abstractions/models/IAppModel.js";

export interface IPulumiGetStackExportService {
    execute<TOutput extends Record<string, any> = Record<string, any>>(
        app: IAppModel
    ): Promise<TOutput | null>;
}

export const PulumiGetStackExportService = createAbstraction<IPulumiGetStackExportService>(
    "PulumiGetStackExportService"
);

export namespace PulumiGetStackExportService {
    export type Interface = IPulumiGetStackExportService;
}
