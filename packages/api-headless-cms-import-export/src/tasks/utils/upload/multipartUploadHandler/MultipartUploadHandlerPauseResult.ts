import { NonEmptyArray } from "@webiny/api/types";
import { IMultipartUploadHandlerPauseResult, ITag } from "../abstractions/MultipartUploadHandler";

export class MultipartUploadHandlerPauseResult implements IMultipartUploadHandlerPauseResult {
    nextPart: number;
    uploadId: string;
    tags: NonEmptyArray<ITag>;

    public constructor(params: IMultipartUploadHandlerPauseResult) {
        this.nextPart = params.nextPart;
        this.uploadId = params.uploadId;
        this.tags = params.tags;
    }
}

export const createMultipartUploadHandlerPauseResult = (
    params: IMultipartUploadHandlerPauseResult
): IMultipartUploadHandlerPauseResult => {
    return new MultipartUploadHandlerPauseResult(params);
};
