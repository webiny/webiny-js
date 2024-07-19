import { FileManagerContext } from "@webiny/api-file-manager/types";
import { Context as TasksContext } from "@webiny/tasks/types";
import { ICmsImportExportRecord } from "./domain/abstractions/CmsImportExportRecord";
import { GenericRecord, NonEmptyArray } from "@webiny/api/types";

export * from "./domain/abstractions/CmsImportExportRecord";

export enum CmsImportExportFileType {
    COMBINED_ENTRIES = "combinedEntries",
    ENTRIES = "entries",
    ASSETS = "assets"
}

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

export interface ICmsImportExportObjectValidateImportFromUrlParams {
    data: string;
}

export interface ICmsImportExportFile {
    get: string;
    head: string;
    type: CmsImportExportFileType;
}

export interface ICmsImportExportObjectValidateImportFromUrlResult {
    files: NonEmptyArray<ICmsImportExportFile>;
    id: string;
}

export interface ICmsImportExportObjectGetValidateImportFromUrlParams {
    id: string;
}

export interface ICmsImportExportValidatedFileError {
    message: string;
    data?: GenericRecord;
}

export interface ICmsImportExportValidatedFile {
    get: string;
    head: string;
    type: CmsImportExportFileType | undefined;
    size: number | undefined;
    error?: ICmsImportExportValidatedFileError;
}

export interface ICmsImportExportObjectGetValidateImportFromUrlResult {
    id: string;
    files: NonEmptyArray<ICmsImportExportValidatedFile> | undefined;
    error?: GenericRecord;
}

export interface CmsImportExportObject {
    getExportContentEntries(
        params: ICmsImportExportObjectGetExportParams
    ): Promise<ICmsImportExportRecord>;
    exportContentEntries(
        params: ICmsImportExportObjectStartExportParams
    ): Promise<ICmsImportExportRecord>;
    abortExportContentEntries(
        params: ICmsImportExportObjectAbortExportParams
    ): Promise<ICmsImportExportRecord>;
    validateImportFromUrl(
        params: ICmsImportExportObjectValidateImportFromUrlParams
    ): Promise<ICmsImportExportObjectValidateImportFromUrlResult>;
    getValidateImportFromUrl(
        params: ICmsImportExportObjectGetValidateImportFromUrlParams
    ): Promise<ICmsImportExportObjectGetValidateImportFromUrlResult>;
}

export interface Context extends FileManagerContext, TasksContext {
    cmsImportExport: CmsImportExportObject;
}
