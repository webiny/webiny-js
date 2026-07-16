import { createAbstraction } from "@webiny/feature/api";

export interface IFileManagerServerConfig {
    readonly storagePath: string;
    readonly uploadSecret: string;
    /** The API's public origin (no trailing slash), e.g. https://api.example.com. */
    readonly apiUrl: string;
}

export const FileManagerServerConfig = createAbstraction<IFileManagerServerConfig>(
    "FileManagerServer/Config"
);

export namespace FileManagerServerConfig {
    export type Interface = IFileManagerServerConfig;
}
