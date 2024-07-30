import { IAwsUpload, IUpload, IUploadDoneResult } from "~/tasks/utils/upload";
import { Options as BaseUploadOptions } from "@webiny/aws-sdk/lib-storage";
import { PassThrough } from "stream";

export interface ICreateUploadParams {
    stream: PassThrough;
    filename: string;
    factory?(params: BaseUploadOptions): IAwsUpload;
    queueSize?: number;
}

export interface IExtendedUpload extends IUpload {
    filename: string;
}

export const createUpload = (params: ICreateUploadParams): IExtendedUpload => {
    return {
        ...params,
        upload: {} as any,
        async done() {
            return {} as IUploadDoneResult;
        },
        async abort() {
            return;
        },
        onProgress() {
            return;
        }
    };
};
