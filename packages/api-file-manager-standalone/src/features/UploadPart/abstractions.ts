import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { UploadRejectedError } from "~/domain/UploadRejectedError.js";

export interface IUploadPartUseCaseParams {
    uploadId: string;
    partNumber: number;
    /** The upload token `CreateMultiPartUploadUseCase` handed out for this part. */
    token: string;
    body: Buffer;
}

export interface IUploadPartUseCaseResult {
    etag: string;
}

export interface IUploadPartUseCase {
    execute(
        params: IUploadPartUseCaseParams
    ): Promise<Result<IUploadPartUseCaseResult, UploadRejectedError>>;
}

/** Stores one part of a multipart upload, after checking the part's upload token. */
export const UploadPartUseCase = createAbstraction<IUploadPartUseCase>(
    "FileManagerServer/UploadPartUseCase"
);

export namespace UploadPartUseCase {
    export type Interface = IUploadPartUseCase;
    export type Params = IUploadPartUseCaseParams;
    export type Output = IUploadPartUseCaseResult;
}
