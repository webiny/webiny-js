import type {
    IMultipartUploadHandlerPauseResult,
    IPart
} from "../abstractions/MultipartUploadHandler";

export class MultipartUploadHandlerPauseResult implements IMultipartUploadHandlerPauseResult {
    uploadId: string;
    parts: IPart[];

    public constructor(params: IMultipartUploadHandlerPauseResult) {
        this.uploadId = params.uploadId;
        this.parts = params.parts;
    }
}

export const createMultipartUploadHandlerPauseResult = (
    params: IMultipartUploadHandlerPauseResult
): IMultipartUploadHandlerPauseResult => {
    return new MultipartUploadHandlerPauseResult(params);
};
