import { createFileManagerOnPutPlugin } from "./fileManagerOnPut.js";
import { createFileManagerOnDeletePlugin } from "./fileManagerOnDelete.js";
import type { IGetLambdaTriggerCb, ICreateS3ClientCb } from "./types.js";

export interface ICreateFileManagerPluginsParams {
    createS3Client: ICreateS3ClientCb;
    getLambdaTrigger: IGetLambdaTriggerCb;
}

export const createFileManagerPlugins = (params: ICreateFileManagerPluginsParams) => {
    return [createFileManagerOnPutPlugin(params), createFileManagerOnDeletePlugin(params)];
};
