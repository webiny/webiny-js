import { createAbstraction } from "@webiny/feature/admin";
import type { FileUrlFormatter as IFileUrlFormatter } from "@webiny/admin-ui";

export const FileUrlFormatter = createAbstraction<IFileUrlFormatter>(
    "FileManager/FileUrlFormatter"
);

export namespace FileUrlFormatter {
    export type Interface = IFileUrlFormatter;
}
