import { createAbstraction } from "@webiny/feature/api";

export interface ICompleteMultiPartUploadParams {
    fileKey: string;
    uploadId: string;
}

export interface ICompleteMultiPartUploadUseCase {
    execute(params: ICompleteMultiPartUploadParams): Promise<void>;
}

export const CompleteMultiPartUploadUseCase = createAbstraction<ICompleteMultiPartUploadUseCase>(
    "CompleteMultiPartUploadUseCase"
);

export namespace CompleteMultiPartUploadUseCase {
    export type Interface = ICompleteMultiPartUploadUseCase;
    export type Params = ICompleteMultiPartUploadParams;
}
