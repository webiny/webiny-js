import { FileItem } from "@webiny/app-admin/types";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";
import { IUpdateFile } from "./EditFileUsingUrlRepository";

type FileManagerApi = ReturnType<typeof useFileManagerApi>;

export class UpdateFile implements IUpdateFile {
    private fileApi: FileManagerApi;

    constructor(fileApi: FileManagerApi) {
        this.fileApi = fileApi;
    }

    async execute(id: string, file: Partial<FileItem>): Promise<void> {
        return this.fileApi.updateFile(id, file);
    }
}
