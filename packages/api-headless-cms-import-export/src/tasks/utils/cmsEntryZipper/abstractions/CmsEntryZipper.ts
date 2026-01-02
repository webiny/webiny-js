import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ICmsEntryZipperExecuteContinueResult } from "./CmsEntryZipperExecuteContinueResult.js";
import type { ICmsEntryZipperExecuteDoneResult } from "./CmsEntryZipperExecuteDoneResult.js";
import type { IIsCloseToTimeoutCallable } from "@webiny/tasks";

export interface ICmsEntryZipperExecuteParams {
    isCloseToTimeout: IIsCloseToTimeoutCallable;
    isAborted(): boolean;
    model: CmsModel;
    after?: string | null;
    exportAssets: boolean;
}

export type ICmsEntryZipperExecuteResult =
    | ICmsEntryZipperExecuteContinueResult
    | ICmsEntryZipperExecuteDoneResult;

export interface ICmsEntryZipper {
    execute(params: ICmsEntryZipperExecuteParams): Promise<ICmsEntryZipperExecuteResult>;
}
