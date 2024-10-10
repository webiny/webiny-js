import type { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import type {
    ITaskResponseDoneResultOutput,
    ITaskResponseResult,
    ITaskRunParams
} from "@webiny/tasks";
import type { Context } from "~/types";

export interface IExportContentEntriesInputFile {
    readonly key: string;
    readonly checksum: string;
}

export interface IExportContentEntriesInput {
    modelId: string;
    prefix: string;
    exportAssets: boolean;
    limit?: number;
    where?: CmsEntryListWhere;
    sort?: CmsEntryListSort;
    after?: string;
    combine?: boolean;
    lastFileProcessed?: string;
    files?: IExportContentEntriesInputFile[];
}

export interface IExportContentEntriesOutputFile {
    readonly key: string;
    readonly checksum: string;
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
