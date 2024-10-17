import type {
    CmsEntryListSort,
    CmsEntryListWhere,
    CmsModelField
} from "@webiny/api-headless-cms/types";
import type {
    ITaskResponseDoneResultOutput,
    ITaskResponseResult,
    ITaskRunParams
} from "@webiny/tasks";
import type { CmsImportExportFileType, Context } from "~/types";

export enum ExportContentEntriesControllerState {
    entryExport = "entryExport",
    assetsExport = "assetsExport"
}

export interface IExportContentEntriesControllerInput {
    modelId: string;
    exportAssets: boolean;
    contentEntriesTaskId?: string;
    contentAssetsTaskId?: string;
    prefix?: string;
    limit?: number;
    where?: CmsEntryListWhere;
    sort?: CmsEntryListSort;
    state?: ExportContentEntriesControllerState;
}

export interface IExportContentEntriesControllerOutputFile {
    readonly key: string;
    readonly checksum: string;
    readonly type: CmsImportExportFileType;
}

export interface IExportedCmsModel {
    modelId: string;
    fields: CmsModelField[];
}

export interface IExportContentEntriesControllerOutput extends ITaskResponseDoneResultOutput {
    model: IExportedCmsModel;
    files: IExportContentEntriesControllerOutputFile[];
}

export interface IExportContentEntriesController<
    C extends Context = Context,
    I extends IExportContentEntriesControllerInput = IExportContentEntriesControllerInput,
    O extends IExportContentEntriesControllerOutput = IExportContentEntriesControllerOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
