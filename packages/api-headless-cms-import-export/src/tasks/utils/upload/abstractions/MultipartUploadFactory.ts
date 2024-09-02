import { IMultipartUploadHandler, ITag } from "./MultipartUploadHandler";
import { NonEmptyArray } from "@webiny/api/types";

export interface IMultipartUploadFactoryContinueParams {
    uploadId: string;
    part: number;
    tags: NonEmptyArray<ITag>;
}

export interface IMultipartUploadFactory {
    start(
        params?: Partial<IMultipartUploadFactoryContinueParams>
    ): Promise<IMultipartUploadHandler>;
}
