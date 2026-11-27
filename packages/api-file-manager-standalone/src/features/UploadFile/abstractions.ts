import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { UploadRejectedError } from "~/domain/UploadRejectedError.js";

export interface IUploadFileUseCaseParams {
    /** The storage key the client says it uploads to; must match the token's. */
    key: string;
    /** The upload token `GetUploadPayloadUseCase` handed out. */
    token: string;
    contents: Buffer;
}

export interface IUploadFileUseCase {
    execute(params: IUploadFileUseCaseParams): Promise<Result<void, UploadRejectedError>>;
}

/** Stores a file uploaded in one request, after checking its upload token. */
export const UploadFileUseCase = createAbstraction<IUploadFileUseCase>(
    "FileManagerServer/UploadFileUseCase"
);

export namespace UploadFileUseCase {
    export type Interface = IUploadFileUseCase;
    export type Params = IUploadFileUseCaseParams;
}
