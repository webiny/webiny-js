import { createAbstraction } from "@webiny/feature/api";
import type { FileData } from "~/features/upload/types.js";
import type { CreateMultiPartUploadResult } from "~/features/upload/types.js";

export interface ICreateMultiPartUploadParams {
    file: FileData;
    numberOfParts: number;
}

export interface ICreateMultiPartUploadUseCase {
    execute(params: ICreateMultiPartUploadParams): Promise<CreateMultiPartUploadResult>;
}

export const CreateMultiPartUploadUseCase = createAbstraction<ICreateMultiPartUploadUseCase>(
    "CreateMultiPartUploadUseCase"
);

export namespace CreateMultiPartUploadUseCase {
    export type Interface = ICreateMultiPartUploadUseCase;
    export type Params = ICreateMultiPartUploadParams;
}
