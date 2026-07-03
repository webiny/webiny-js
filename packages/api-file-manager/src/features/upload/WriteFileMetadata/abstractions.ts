import { createAbstraction } from "@webiny/feature/api";
import type { File as IFile } from "~/domain/file/types.js";

export interface IMetadataWriter {
    write(files: IFile[]): Promise<void>;
}

export const MetadataWriter = createAbstraction<IMetadataWriter>(
    "FileManager/Upload/MetadataWriter"
);

export namespace MetadataWriter {
    export type Interface = IMetadataWriter;
    export type File = IFile;
}
