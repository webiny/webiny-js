import { CmsEntryListWhere, CmsModelField } from "@webiny/api-headless-cms/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { CmsImportExportFileType, Context } from "~/types";

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
    sort?: string[];
    after?: string;
    state?: ExportContentEntriesControllerState;
}

export interface IExportContentEntriesControllerOutputFile {
    readonly head: string;
    readonly get: string;
    readonly checksum: string;
    readonly type: CmsImportExportFileType;
}

// export interface ICmsDynamicZoneTemplate
//     extends Pick<CmsDynamicZoneTemplate, "id" | "gqlTypeName"> {
//     fields: IExportedCmsModelField[];
// }

// export interface IExportedCmsModelFieldSettings {
//     fields?: IExportedCmsModelField[];
//     templates?: ICmsDynamicZoneTemplate[];
//     models?: Pick<CmsModel, "modelId">[];
// }

// export interface IExportedCmsModelField
//     extends Pick<CmsModelField, "id" | "fieldId" | "type" | "multipleValues" | "storageId"> {
//     settings?: IExportedCmsModelFieldSettings;
// }

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
