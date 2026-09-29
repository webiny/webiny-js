import { createAbstraction } from "@webiny/feature/api";

export interface IFileManagerStandaloneConfig {
    readonly storagePath: string;
    readonly uploadSecret: string;
    /** The API's public origin (no trailing slash), e.g. https://api.example.com. */
    readonly apiUrl: string;
}

export const FileManagerStandaloneConfig = createAbstraction<IFileManagerStandaloneConfig>(
    "FileManagerServer/Config"
);

export namespace FileManagerStandaloneConfig {
    export type Interface = IFileManagerStandaloneConfig;
}
