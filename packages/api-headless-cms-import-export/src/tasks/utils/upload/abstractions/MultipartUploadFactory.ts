import { IMultipartUpload } from "./MultipartUpload";

export interface IMultipartUploadFactoryContinueParams {
    uploadId: string;
    part: number;
}

export interface IMultipartUploadFactory {
    start(): Promise<IMultipartUpload>;
    continue(params: IMultipartUploadFactoryContinueParams): IMultipartUpload;
}
