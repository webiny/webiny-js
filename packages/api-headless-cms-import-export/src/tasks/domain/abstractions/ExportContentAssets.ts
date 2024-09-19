import type { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import type {
    ITaskResponseDoneResultOutput,
    ITaskResponseResult,
    ITaskRunParams
} from "@webiny/tasks";
import type { Context } from "~/types";

export interface IExportContentAssetsInputFile {
    readonly key: string;
    readonly checksum: string;
}

export interface IExportContentAssetsInput {
    modelId: string;
    prefix: string;
    limit?: number;
    where?: CmsEntryListWhere;
    sort?: CmsEntryListSort;
    entryAfter: string | undefined;
    fileAfter: string | undefined;
    files?: IExportContentAssetsInputFile[];
}

export interface IExportContentAssetsOutputFile {
    readonly key: string;
    readonly checksum: string;
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
