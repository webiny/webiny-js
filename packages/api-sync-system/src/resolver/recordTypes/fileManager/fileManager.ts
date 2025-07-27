import { createFileManagerOnPutPlugin } from "./fileManagerOnPut.js";
import { createFileManagerOnDeletePlugin } from "./fileManagerOnDelete.js";
import type { ICopyFile, IDeleteFile } from "~/resolver/recordTypes/fileManager/types.js";

export interface ICreateFileManagerPluginsParams {
    copyFile: ICopyFile;
    deleteFile: IDeleteFile;
}

export const createFileManagerPlugins = (params: ICreateFileManagerPluginsParams) => {
    return [createFileManagerOnPutPlugin(params), createFileManagerOnDeletePlugin(params)];
};
