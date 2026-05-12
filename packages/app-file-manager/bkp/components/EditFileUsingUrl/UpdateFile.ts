import type { FileItem } from "~/types.js";
import type { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext/index.js";
import type { IUpdateFile } from "./EditFileUsingUrlRepository.js";

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
