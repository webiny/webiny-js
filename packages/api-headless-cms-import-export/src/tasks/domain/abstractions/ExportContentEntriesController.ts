import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { Context } from "~/types";

export enum ExportContentEntriesControllerState {
    entryExport = "entryExport",
    mergeEntryExports = "mergeEntryExports",
    assetsExport = "assetsExport",
    mergeAssetExports = "mergeAssetExports"
}

export interface IExportContentEntriesControllerInput {
    modelId: string;
    contentEntriesTaskId?: string;
    contentAssetsTaskId?: string;
    prefix?: string;
    limit?: number;
    where?: CmsEntryListWhere;
    sort?: string[];
    after?: string;
    state?: ExportContentEntriesControllerState;
}

export interface IExportContentEntriesControllerOutput extends ITaskResponseDoneResultOutput {
    file: string;
    url: string;
    expiresOn: Date;
}

export interface ExportContentEntriesController<
    C extends Context = Context,
    I extends IExportContentEntriesControllerInput = IExportContentEntriesControllerInput,
    O extends IExportContentEntriesControllerOutput = IExportContentEntriesControllerOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
