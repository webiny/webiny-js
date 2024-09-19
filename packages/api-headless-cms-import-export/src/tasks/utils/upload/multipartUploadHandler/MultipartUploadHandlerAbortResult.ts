import type { AbortMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";
import type {
    IMultipartUploadHandlerAbortResult,
    IPart
} from "../abstractions/MultipartUploadHandler";

export class MultipartUploadHandlerAbortResult implements IMultipartUploadHandlerAbortResult {
    public readonly result: AbortMultipartUploadCommandOutput;
    public readonly uploadId: string;
    public readonly parts: IPart[];

    public constructor(params: IMultipartUploadHandlerAbortResult) {
        this.result = params.result;
        this.uploadId = params.uploadId;
        this.parts = params.parts;
    }
}

export const createMultipartUploadHandlerAbortResult = (
    params: IMultipartUploadHandlerAbortResult
): IMultipartUploadHandlerAbortResult => {
    return new MultipartUploadHandlerAbortResult(params);
};
