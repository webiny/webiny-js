import { createAbstraction } from "@webiny/feature/admin";
import type { FileUrlFormatter as IFileUrlFormatter, FileUrlParams } from "@webiny/admin-ui";

export const FileUrlFormatter = createAbstraction<IFileUrlFormatter>("FileUrlFormatter");

export namespace FileUrlFormatter {
    export type Interface = IFileUrlFormatter;
    export type Params = FileUrlParams;
}
