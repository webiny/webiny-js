import { CmsContext } from "@webiny/api-headless-cms/types";
import { Context as TasksContext, ITaskResponseDoneResultOutput } from "@webiny/tasks/types";
import { ICmsImportExportRecord } from "./domain/abstractions/CmsImportExportRecord";

export * from "./domain/abstractions/CmsImportExportRecord";

export interface ICmsImportExportObjectStartExportParams {
    modelId: string;
}

export interface ICmsImportExportObjectAbortExportParams {
    id: string;
}

export interface ICmsImportExportTaskParams {
    modelId: string;
}

export interface ICmsImportExportTaskOutput extends ITaskResponseDoneResultOutput {
    file?: string;
    url?: string;
}

export interface CmsImportExportObject {
    startExportContentEntries(
        params: ICmsImportExportObjectStartExportParams
    ): Promise<ICmsImportExportRecord>;
    abortExportContentEntries(params: ICmsImportExportObjectAbortExportParams): Promise<void>;
}

export interface Context extends CmsContext, TasksContext {
    cmsImportExport: CmsImportExportObject;
}
