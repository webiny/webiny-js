import { Abstraction } from "@webiny/di";

export interface NamedExport {
    name: string;
    isTypeOnly: boolean;
}

export interface ExportStatement {
    namedExports: NamedExport[];
    source: string;
    isWildcard: boolean;
    isTypeOnly: boolean;
}

export interface IParseExportsFileService {
    execute(fileContent: string, filePath?: string): ExportStatement[];
}

export const ParseExportsFileService = new Abstraction<IParseExportsFileService>(
    "ParseExportsFileService"
);

export namespace ParseExportsFileService {
    export type Interface = IParseExportsFileService;
    export type ExportStatement = ExportStatement;
    export type NamedExport = NamedExport;
}
