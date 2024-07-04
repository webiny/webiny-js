import { ICmsAssetsZipperExecuteContinueResult } from "./CmsAssetsZipperExecuteContinueResult";
import { ICmsAssetsZipperExecuteDoneResult } from "./CmsAssetsZipperExecuteDoneResult";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { ICmsAssetsZipperExecuteDoneWithoutResult } from "./CmsAssetsZipperExecuteDoneWithoutResult";
import { ICmsAssetsZipperExecuteContinueWithoutResult } from "./CmsAssetsZipperExecuteContinueWithoutResult";

export interface ICmsAssetsZipperExecuteParams {
    isCloseToTimeout(): boolean;
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
