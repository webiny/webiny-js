import { Abstraction } from "@webiny/di";

export interface ExportFileInput {
    packageName: string;
    fileContent: string;
    filePath?: string;
}

export interface IMergeExportsService {
    execute(inputs: ExportFileInput[]): string;
}

export const MergeExportsService = new Abstraction<IMergeExportsService>("MergeExportsService");

export namespace MergeExportsService {
    export type Interface = IMergeExportsService;
    export type ExportFileInput = ExportFileInput;
}
