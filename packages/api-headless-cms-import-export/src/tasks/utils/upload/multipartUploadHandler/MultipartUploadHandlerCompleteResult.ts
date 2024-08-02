import { CompleteMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";
import { NonEmptyArray } from "@webiny/api/types";
import { IMultipartUploadHandlerCompleteResult } from "../abstractions/MultipartUploadHandler";

export class MultipartUploadHandlerCompleteResult implements IMultipartUploadHandlerCompleteResult {
    public readonly result: CompleteMultipartUploadCommandOutput;
    public readonly uploadId: string;
    public readonly tags: NonEmptyArray<string>;

    public constructor(params: IMultipartUploadHandlerCompleteResult) {
        this.result = params.result;
        this.uploadId = params.uploadId;
        this.tags = params.tags;
    }
}

export const createMultipartUploadHandlerCompleteResult = (
    params: IMultipartUploadHandlerCompleteResult
): IMultipartUploadHandlerCompleteResult => {
    return new MultipartUploadHandlerCompleteResult(params);
};
