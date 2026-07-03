import { createAbstraction } from "@webiny/feature/api";
import type { FileData } from "~/features/upload/types.js";
import type { UploadPayloadResponse } from "~/features/upload/types.js";
import type { FileManagerSettings } from "~/domain/settings/types.js";

export interface IGetUploadPayloadUseCase {
    execute(file: FileData, settings: FileManagerSettings): Promise<UploadPayloadResponse>;
}

export const GetUploadPayloadUseCase =
    createAbstraction<IGetUploadPayloadUseCase>("GetUploadPayloadUseCase");

export namespace GetUploadPayloadUseCase {
    export type Interface = IGetUploadPayloadUseCase;
}
