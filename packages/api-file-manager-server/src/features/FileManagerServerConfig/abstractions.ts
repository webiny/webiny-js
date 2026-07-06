import { createAbstraction } from "@webiny/feature/api";

export interface IFileManagerServerConfig {
    readonly storagePath: string;
    readonly uploadSecret: string;
}

export const FileManagerServerConfig = createAbstraction<IFileManagerServerConfig>(
    "FileManagerServer/Config"
);

export namespace FileManagerServerConfig {
    export type Interface = IFileManagerServerConfig;
}
