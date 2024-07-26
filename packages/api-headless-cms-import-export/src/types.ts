import { FileManagerContext } from "@webiny/api-file-manager/types";
import { Context as TasksContext, TaskDataStatus } from "@webiny/tasks/types";
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
    error?: ICmsImportExportValidatedFileError;
}

export interface ICmsImportExportObjectValidateImportFromUrlResult {
    files: NonEmptyArray<ICmsImportExportFile>;
    modelId: string;
    id: string;
    status: TaskDataStatus;
}

export interface ICmsImportExportObjectGetValidateImportFromUrlParams {
    id: string;
}

export interface ICmsImportExportValidatedFileError {
    message: string;
    code: string;
    data?: GenericRecord;
}

export interface ICmsImportExportValidatedFile {
    get: string;
    head: string;
    type: CmsImportExportFileType | undefined;
    size?: number;
    error?: ICmsImportExportValidatedFileError;
}

export interface ICmsImportExportValidatedCombinedContentFile
    extends ICmsImportExportValidatedFile {
    type: CmsImportExportFileType.COMBINED_ENTRIES;
}

export interface ICmsImportExportValidatedContentEntriesFile extends ICmsImportExportValidatedFile {
    type: CmsImportExportFileType.ENTRIES;
}

export interface ICmsImportExportValidatedAssetsFile extends ICmsImportExportValidatedFile {
    type: CmsImportExportFileType.ASSETS;
}

export interface ICmsImportExportObjectGetValidateImportFromUrlResult {
    id: string;
    files: NonEmptyArray<ICmsImportExportValidatedFile> | undefined;
    status: TaskDataStatus;
    error?: GenericRecord;
}

export interface ICmsImportExportObjectImportFromUrlParams {
    id: string;
}

export interface ICmsImportExportProcessedFile extends ICmsImportExportValidatedFile {
    status: string;
}

export interface ICmsImportExportObjectImportFromUrlResult {
    id: string;
    done: string[];
    failed: string[];
    aborted: string[];
    invalid: string[];
    status: TaskDataStatus;
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
    importFromUrl(
        params: ICmsImportExportObjectImportFromUrlParams
    ): Promise<ICmsImportExportObjectImportFromUrlResult>;
}

export interface Context extends FileManagerContext, TasksContext {
    cmsImportExport: CmsImportExportObject;
}
