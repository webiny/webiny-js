import type {
    CmsEntryListSort,
    CmsEntryListWhere,
    CmsModelField
} from "@webiny/api-headless-cms/types/index.js";
import type { CmsImportExportFileType } from "~/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export enum ExportContentEntriesControllerState {
    entryExport = "entryExport",
    assetsExport = "assetsExport"
}

export interface IControllerInput {
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

export interface IControllerOutputFile {
    readonly key: string;
    readonly checksum: string;
    readonly type: CmsImportExportFileType;
}

export interface IExportedCmsModel {
    modelId: string;
    fields: CmsModelField[];
}

export interface IControllerOutput extends TaskDefinition.TaskOutput {
    model: IExportedCmsModel;
    files: IControllerOutputFile[];
}

export interface IExportContentEntriesController<
    I extends IControllerInput = IControllerInput,
    O extends IControllerOutput = IControllerOutput
> {
    run(params: TaskDefinition.RunParams<I, O>): Promise<TaskDefinition.Result<I, O>>;
}
