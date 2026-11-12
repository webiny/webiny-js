import { createAbstraction } from "@webiny/feature/api";
import type { FileData } from "~/features/upload/types.js";
import type { CreateMultiPartUploadResult } from "~/features/upload/types.js";

export interface ICreateMultiPartUploadParams {
    file: FileData;
    numberOfParts: number;
    /**
     * The file id, when it was provided by the client (not generated on the server).
     */
    clientId?: string;
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
