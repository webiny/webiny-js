import { createAbstraction } from "@webiny/feature/api";

export interface IFileManagerStandaloneConfig {
    /** Absolute path of the directory uploaded files are written to and served from. */
    readonly storagePath: string;
    /** Secret that signs upload tokens. */
    readonly uploadSecret: string;
}

/**
 * Local file storage settings. The standalone API handler reads them from env when the server
 * starts and passes them to `FileManagerStandaloneFeature.register()`.
 */
export const FileManagerStandaloneConfig = createAbstraction<IFileManagerStandaloneConfig>(
    "FileManagerServer/Config"
);

export namespace FileManagerStandaloneConfig {
    export type Interface = IFileManagerStandaloneConfig;
}
