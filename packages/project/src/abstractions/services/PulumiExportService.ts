import { createAbstraction } from "~/abstractions/createAbstraction.js";
import { type IAppModel } from "~/abstractions/models/IAppModel.js";

export interface IPulumiExportService {
    execute<TOutput extends Record<string, any> = Record<string, any>>(
        app: IAppModel
    ): Promise<TOutput | null>;
}

export const PulumiExportService = createAbstraction<IPulumiExportService>("PulumiExportService");

export namespace PulumiExportService {
    export type Interface = IPulumiExportService;
}

// Backwards compatibility alias
/** @deprecated Use PulumiExportService instead */
export const PulumiGetStackExportService = PulumiExportService;
export namespace PulumiGetStackExportService {
    export type Interface = IPulumiExportService;
}
