import type { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

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
    after?: string | null;
    combine?: boolean;
    lastFileProcessed?: string;
    files?: IExportContentEntriesInputFile[];
}

export interface IExportContentEntriesOutputFile {
    readonly key: string;
    readonly checksum: string;
}

export interface IExportContentEntriesOutput extends TaskService.GenericOutput {
    files: IExportContentEntriesOutputFile[];
}

export interface IExportContentEntries<
    I extends IExportContentEntriesInput = IExportContentEntriesInput,
    O extends IExportContentEntriesOutput = IExportContentEntriesOutput
> {
    run(params: TaskDefinition.RunParams<I, O>): Promise<TaskDefinition.Result<I, O>>;
}
