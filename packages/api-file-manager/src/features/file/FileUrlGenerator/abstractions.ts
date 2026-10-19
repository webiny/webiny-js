import { createAbstraction } from "@webiny/feature/api";
import type { File } from "~/domain/file/types.js";

export interface IFileUrlGenerator {
    generateUrl(file: File): Promise<string>;
}

/* Generate URLs for uploaded files. */
export const FileUrlGenerator = createAbstraction<IFileUrlGenerator>(
    "FileManager/FileUrlGenerator"
);

export namespace FileUrlGenerator {
    export type Interface = IFileUrlGenerator;
}

export interface IFileUrlPrefixProvider {
    getPrefix(): Promise<string>;
}

/**
 * Provides the prefix the default FileUrlGenerator puts in front of a file's key. The default
 * implementation reads `srcPrefix` from the File Manager settings. Replace it to load the prefix
 * from somewhere else, without touching how URLs are put together.
 */
export const FileUrlPrefixProvider = createAbstraction<IFileUrlPrefixProvider>(
    "FileManager/FileUrlPrefixProvider"
);

export namespace FileUrlPrefixProvider {
    export type Interface = IFileUrlPrefixProvider;
}
