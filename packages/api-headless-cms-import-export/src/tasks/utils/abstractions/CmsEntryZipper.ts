import { CmsModel } from "@webiny/api-headless-cms/types";

export interface ICmsEntryZipperExecuteParams {
    shouldAbort(): boolean;
    model: Pick<CmsModel, "modelId">;
}

export interface ICmsEntryZipperExecuteResult {
    key: string;
    url: string;
    bucket: string;
    expiresOn: Date;
}

export interface ICmsEntryZipper {
    execute(params: ICmsEntryZipperExecuteParams): Promise<ICmsEntryZipperExecuteResult>;
}
