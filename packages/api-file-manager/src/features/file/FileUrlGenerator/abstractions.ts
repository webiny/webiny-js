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
