import { Abstraction } from "@webiny/di";

export interface ExportStatement {
    namedExports: string[];
    source: string;
    isWildcard: boolean;
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
}
