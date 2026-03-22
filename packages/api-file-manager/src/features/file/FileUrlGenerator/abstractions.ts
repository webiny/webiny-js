import { createAbstraction } from "@webiny/feature/api";

interface IFileUrlGenerator {
    generateUrl(file: File): string;
}

/** Generate URLs for uploaded files. */
export const FileUrlGenerator = createAbstraction<IFileUrlGenerator>("IFileUrlGenerator");

export namespace FileUrlGenerator {
    export type Interface = IFileUrlGenerator;
}
