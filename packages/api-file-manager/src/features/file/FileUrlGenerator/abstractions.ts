import { createAbstraction } from "@webiny/feature/api";

interface IFileUrlGenerator {
    generateUrl(file: File): string;
}

export const FileUrlGenerator = createAbstraction<IFileUrlGenerator>("IFileUrlGenerator");

export namespace FileUrlGenerator {
    export type Interface = IFileUrlGenerator;
}
