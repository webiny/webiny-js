import { CmsModel } from "@webiny/api-headless-cms/types";
import { ICmsEntryZipperExecuteContinueResult } from "./CmsEntryZipperExecuteContinueResult";
import { ICmsEntryZipperExecuteDoneResult } from "./CmsEntryZipperExecuteDoneResult";
import { IIsCloseToTimeoutCallable } from "@webiny/tasks";

export interface ICmsEntryZipperExecuteParams {
    isCloseToTimeout: IIsCloseToTimeoutCallable;
    isAborted(): boolean;
    model: CmsModel;
    after: string | undefined;
    exportAssets: boolean;
}

export type ICmsEntryZipperExecuteResult =
    | ICmsEntryZipperExecuteContinueResult
    | ICmsEntryZipperExecuteDoneResult;

export interface ICmsEntryZipper {
    execute(params: ICmsEntryZipperExecuteParams): Promise<ICmsEntryZipperExecuteResult>;
}
