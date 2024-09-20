import type { FileManagerContext } from "@webiny/api-file-manager/types";
import type { Context as TasksContext, TaskDataStatus } from "@webiny/tasks/types";
import type { ICmsImportExportRecord } from "./domain/abstractions/CmsImportExportRecord";
import type { GenericRecord, NonEmptyArray } from "@webiny/api/types";
import type {
    CmsEntryListSort,
    CmsEntryListWhere,
    CmsEntryMeta
} from "@webiny/api-headless-cms/types";

export * from "./domain/abstractions/CmsImportExportRecord";

export enum CmsImportExportFileType {
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
    where?: CmsEntryListWhere;
    sort?: CmsEntryListSort;
}

export interface ICmsImportExportObjectAbortExportParams {
    id: string;
}

export interface ICmsImportExportObjectValidateImportFromUrlParams {
    data: string | GenericRecord;
}

export interface ICmsImportExportFile {
    get: string;
    head: string;
    checksum: string;
    key: string;
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

export interface ICmsImportExportValidatedValidFile {
    get: string;
    head: string;
    key: string;
    checksum: string;
    type: CmsImportExportFileType | undefined;
    size: number;
    checked: boolean;
    error?: never;
}

export interface ICmsImportExportValidatedInvalidFile
    extends Partial<Omit<ICmsImportExportValidatedValidFile, "error">> {
    checked: boolean;
    error: ICmsImportExportValidatedFileError;
}

export type ICmsImportExportValidatedFile =
    | ICmsImportExportValidatedValidFile
    | ICmsImportExportValidatedInvalidFile;

export interface ICmsImportExportValidatedContentEntriesFile
    extends ICmsImportExportValidatedValidFile {
    size: number;
    type: CmsImportExportFileType.ENTRIES;
}

export interface ICmsImportExportValidatedAssetsFile extends ICmsImportExportValidatedValidFile {
    size: number;
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
    maxInsertErrors?: number;
    overwrite?: boolean;
}

export interface ICmsImportExportObjectAbortImportFromUrlParams {
    id: string;
}

export interface ICmsImportExportObjectGetImportFromUrlParams {
    id: string;
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

export interface IListExportContentEntriesParams {
    limit?: number;
    after?: string;
}

export interface IListExportContentEntriesResult {
    items: Omit<ICmsImportExportRecord, "files">[];
    meta: CmsEntryMeta;
}

export interface CmsImportExportObject {
    getExportContentEntries(
        params: ICmsImportExportObjectGetExportParams
    ): Promise<ICmsImportExportRecord>;
    listExportContentEntries(
        params?: IListExportContentEntriesParams
    ): Promise<IListExportContentEntriesResult>;
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
    abortImportFromUrl(
        params: ICmsImportExportObjectAbortImportFromUrlParams
    ): Promise<ICmsImportExportObjectImportFromUrlResult>;
    getImportFromUrl(
        params: ICmsImportExportObjectGetImportFromUrlParams
    ): Promise<ICmsImportExportObjectImportFromUrlResult>;
}

export interface Context extends FileManagerContext, TasksContext {
    cmsImportExport: CmsImportExportObject;
}
