import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { Context } from "~/types";

export interface IExportContentAssetsInput {
    modelId: string;
    prefix: string;
    limit?: number;
    where?: CmsEntryListWhere;
    sort?: string[];
    entryAfter: string | undefined;
    fileAfter: string | undefined;
    files?: IExportContentAssetsOutputFile[];
}

export interface IExportContentAssetsOutputFile {
    url: string;
    expiresOn: string;
}

export interface IExportContentAssetsOutput extends ITaskResponseDoneResultOutput {
    files: IExportContentAssetsOutputFile[];
}

export interface IExportContentAssets<
    C extends Context = Context,
    I extends IExportContentAssetsInput = IExportContentAssetsInput,
    O extends IExportContentAssetsOutput = IExportContentAssetsOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
