import { ICmsAssetsZipperExecuteContinueResult } from "./CmsAssetsZipperExecuteContinueResult";
import { ICmsAssetsZipperExecuteDoneResult } from "./CmsAssetsZipperExecuteDoneResult";
import { CmsModel } from "@webiny/api-headless-cms/types";

export interface ICmsAssetsZipperExecuteParams {
    isCloseToTimeout(): boolean;
    isAborted(): boolean;
    model: Pick<CmsModel, "modelId">;
    after: string | undefined;
}

export type ICmsAssetsZipperExecuteResult =
    | ICmsAssetsZipperExecuteDoneResult
    | ICmsAssetsZipperExecuteContinueResult;

export interface ICmsAssetsZipper {
    execute(params: ICmsAssetsZipperExecuteParams): Promise<ICmsAssetsZipperExecuteResult>;
}
