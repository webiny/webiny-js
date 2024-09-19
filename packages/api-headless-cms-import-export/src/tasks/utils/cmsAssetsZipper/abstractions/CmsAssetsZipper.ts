import type { ICmsAssetsZipperExecuteContinueResult } from "./CmsAssetsZipperExecuteContinueResult";
import type { ICmsAssetsZipperExecuteDoneResult } from "./CmsAssetsZipperExecuteDoneResult";
import type { ICmsAssetsZipperExecuteDoneWithoutResult } from "./CmsAssetsZipperExecuteDoneWithoutResult";
import type { ICmsAssetsZipperExecuteContinueWithoutResult } from "./CmsAssetsZipperExecuteContinueWithoutResult";
import type { IIsCloseToTimeoutCallable } from "@webiny/tasks";

export interface ICmsAssetsZipperExecuteParams {
    isCloseToTimeout: IIsCloseToTimeoutCallable;
    isAborted(): boolean;
    entryAfter: string | undefined;
    fileAfter: string | undefined;
}

export type ICmsAssetsZipperExecuteResult =
    | ICmsAssetsZipperExecuteDoneResult
    | ICmsAssetsZipperExecuteDoneWithoutResult
    | ICmsAssetsZipperExecuteContinueResult
    | ICmsAssetsZipperExecuteContinueWithoutResult;

export interface ICmsAssetsZipper {
    execute(params: ICmsAssetsZipperExecuteParams): Promise<ICmsAssetsZipperExecuteResult>;
}
