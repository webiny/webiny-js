import type { CmsEntryListSort, CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

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

export interface IExportContentAssetsOutput extends TaskService.GenericOutput {
    files: IExportContentAssetsOutputFile[];
}

export interface IExportContentAssets<
    I extends IExportContentAssetsInput = IExportContentAssetsInput,
    O extends IExportContentAssetsOutput = IExportContentAssetsOutput
> {
    run(params: TaskDefinition.RunParams<I, O>): Promise<TaskDefinition.Result<I, O>>;
}
