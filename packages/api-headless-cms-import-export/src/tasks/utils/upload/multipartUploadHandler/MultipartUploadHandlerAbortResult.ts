import { AbortMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";
import { IMultipartUploadHandlerAbortResult } from "../abstractions/MultipartUploadHandler";

export class MultipartUploadHandlerAbortResult implements IMultipartUploadHandlerAbortResult {
    public readonly result: AbortMultipartUploadCommandOutput;
    public readonly uploadId: string;
    public readonly tags: string[];

    public constructor(params: IMultipartUploadHandlerAbortResult) {
        this.result = params.result;
        this.uploadId = params.uploadId;
        this.tags = params.tags;
    }
}

export const createMultipartUploadHandlerAbortResult = (
    params: IMultipartUploadHandlerAbortResult
): IMultipartUploadHandlerAbortResult => {
    return new MultipartUploadHandlerAbortResult(params);
};
