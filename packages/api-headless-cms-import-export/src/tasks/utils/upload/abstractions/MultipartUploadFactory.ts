import type { IMultipartUploadHandler } from "./MultipartUploadHandler";

export interface IMultipartUploadFactoryContinueParams {
    uploadId?: string;
}

export interface IMultipartUploadFactory {
    start(params?: IMultipartUploadFactoryContinueParams): Promise<IMultipartUploadHandler>;
}
