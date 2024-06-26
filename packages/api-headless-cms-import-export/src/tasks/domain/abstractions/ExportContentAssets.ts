import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { Context } from "~/types";

export interface IExportContentAssetsInput {
    modelId: string;
    prefix: string;
    limit?: number;
    where?: CmsEntryListWhere;
    sort?: string[];
    after?: string;
}

export interface IExportContentAssetsOutput extends ITaskResponseDoneResultOutput {
    file: string;
    url: string;
    expiresOn: Date;
}

export interface IExportContentAssets<
    C extends Context = Context,
    I extends IExportContentAssetsInput = IExportContentAssetsInput,
    O extends IExportContentAssetsOutput = IExportContentAssetsOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
