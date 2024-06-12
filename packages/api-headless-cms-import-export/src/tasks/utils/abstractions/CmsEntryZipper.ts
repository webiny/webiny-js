import { CmsModel } from "@webiny/api-headless-cms/types";
import { CompleteMultipartUploadCommandOutput } from "@webiny/aws-sdk/client-s3";

export interface ICmsEntryZipperExecuteParams {
    shouldAbort(): boolean;
    model: Pick<CmsModel, "modelId">;
}

export interface ICmsEntryZipper {
    execute(params: ICmsEntryZipperExecuteParams): Promise<CompleteMultipartUploadCommandOutput>;
}
