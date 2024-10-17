import type { CmsModel } from "@webiny/api-headless-cms/types";
import type { ICmsEntryZipperExecuteContinueResult } from "./CmsEntryZipperExecuteContinueResult";
import type { ICmsEntryZipperExecuteDoneResult } from "./CmsEntryZipperExecuteDoneResult";
import type { IIsCloseToTimeoutCallable } from "@webiny/tasks";

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
