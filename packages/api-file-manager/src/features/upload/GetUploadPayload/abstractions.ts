import { createAbstraction } from "@webiny/feature/api";
import type { FileData } from "~/features/upload/types.js";
import type { UploadPayloadResponse } from "~/features/upload/types.js";
import type { FileManagerSettings } from "~/domain/settings/types.js";

export interface IGetUploadPayloadOptions {
    /**
     * The file id, when it was provided by the client (not generated on the server).
     */
    clientId?: string;
}

export interface IGetUploadPayloadUseCase {
    execute(
        file: FileData,
        settings: FileManagerSettings,
        options?: IGetUploadPayloadOptions
    ): Promise<UploadPayloadResponse>;
}

export const GetUploadPayloadUseCase =
    createAbstraction<IGetUploadPayloadUseCase>("GetUploadPayloadUseCase");

export namespace GetUploadPayloadUseCase {
    export type Interface = IGetUploadPayloadUseCase;
    export type Options = IGetUploadPayloadOptions;
}
