import { CmsModel } from "@webiny/api-headless-cms/types";
import { ICmsEntryZipperExecuteContinueResult } from "./CmsEntryZipperExecuteContinueResult";
import { ICmsEntryZipperExecuteDoneResult } from "./CmsEntryZipperExecuteDoneResult";

export interface ICmsEntryZipperExecuteParams {
    isCloseToTimeout(): boolean;
    isAborted(): boolean;
    model: Pick<CmsModel, "modelId">;
}

export type ICmsEntryZipperExecuteResult =
    | ICmsEntryZipperExecuteContinueResult
    | ICmsEntryZipperExecuteDoneResult;

export interface ICmsEntryZipper {
    execute(params: ICmsEntryZipperExecuteParams): Promise<ICmsEntryZipperExecuteResult>;
}
