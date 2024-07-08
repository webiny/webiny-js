import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { Context } from "~/types";

export interface IExportContentEntriesInput {
    modelId: string;
    prefix: string;
    limit?: number;
    where?: CmsEntryListWhere;
    sort?: string[];
    after?: string;
    combine?: boolean;
    lastFileProcessed?: string;
    combined?: IExportContentEntriesOutputFile[];
}

export interface IExportContentEntriesOutputFile {
    url: string;
    expiresOn: string;
}

export interface IExportContentEntriesOutput extends ITaskResponseDoneResultOutput {
    files: IExportContentEntriesOutputFile[];
}

export interface IExportContentEntries<
    C extends Context = Context,
    I extends IExportContentEntriesInput = IExportContentEntriesInput,
    O extends IExportContentEntriesOutput = IExportContentEntriesOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
