import type { CompleteMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";
import type {
    IMultipartUploadHandlerCompleteResult,
    IPart
} from "../abstractions/MultipartUploadHandler";

export class MultipartUploadHandlerCompleteResult implements IMultipartUploadHandlerCompleteResult {
    public readonly result: CompleteMultipartUploadCommandOutput;
    public readonly uploadId: string;
    public readonly parts: IPart[];

    public constructor(params: IMultipartUploadHandlerCompleteResult) {
        this.result = params.result;
        this.uploadId = params.uploadId;
        this.parts = params.parts;
    }
}

export const createMultipartUploadHandlerCompleteResult = (
    params: IMultipartUploadHandlerCompleteResult
): IMultipartUploadHandlerCompleteResult => {
    return new MultipartUploadHandlerCompleteResult(params);
};
