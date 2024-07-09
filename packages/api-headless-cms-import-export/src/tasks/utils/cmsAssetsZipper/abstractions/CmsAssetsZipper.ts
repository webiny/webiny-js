import { ICmsAssetsZipperExecuteContinueResult } from "./CmsAssetsZipperExecuteContinueResult";
import { ICmsAssetsZipperExecuteDoneResult } from "./CmsAssetsZipperExecuteDoneResult";
import { ICmsAssetsZipperExecuteDoneWithoutResult } from "./CmsAssetsZipperExecuteDoneWithoutResult";
import { ICmsAssetsZipperExecuteContinueWithoutResult } from "./CmsAssetsZipperExecuteContinueWithoutResult";
import { IIsCloseToTimeoutCallable } from "@webiny/tasks";

export interface ICmsAssetsZipperExecuteParams {
    isCloseToTimeout: IIsCloseToTimeoutCallable;
    isAborted(): boolean;
    entryAfter: string | undefined;
    fileAfter: string | undefined;
    exportAssets: boolean;
}

export type ICmsAssetsZipperExecuteResult =
    | ICmsAssetsZipperExecuteDoneResult
    | ICmsAssetsZipperExecuteDoneWithoutResult
    | ICmsAssetsZipperExecuteContinueResult
    | ICmsAssetsZipperExecuteContinueWithoutResult;

export interface ICmsAssetsZipper {
    execute(params: ICmsAssetsZipperExecuteParams): Promise<ICmsAssetsZipperExecuteResult>;
}
