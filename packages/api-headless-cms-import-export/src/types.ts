import { FileManagerContext } from "@webiny/api-file-manager/types";
import { Context as TasksContext, ITaskResponseDoneResultOutput } from "@webiny/tasks/types";
import { ICmsImportExportRecord } from "./domain/abstractions/CmsImportExportRecord";

export * from "./domain/abstractions/CmsImportExportRecord";

export interface ICmsImportExportObjectGetExportParams {
    id: string;
}

export interface ICmsImportExportObjectStartExportParams {
    modelId: string;
    exportAssets: boolean;
    limit?: number;
}

export interface ICmsImportExportObjectAbortExportParams {
    id: string;
}

export interface ICmsImportExportTaskParams {
    modelId: string;
    limit?: number;
}

export interface ICmsImportExportTaskOutput extends ITaskResponseDoneResultOutput {
    files?: string[];
    expiresOn?: Date;
}

export interface CmsImportExportObject {
    getExportContentEntries(
        params: ICmsImportExportObjectGetExportParams
    ): Promise<ICmsImportExportRecord>;
    startExportContentEntries(
        params: ICmsImportExportObjectStartExportParams
    ): Promise<ICmsImportExportRecord>;
    abortExportContentEntries(
        params: ICmsImportExportObjectAbortExportParams
    ): Promise<ICmsImportExportRecord>;
}

export interface Context extends FileManagerContext, TasksContext {
    cmsImportExport: CmsImportExportObject;
}
