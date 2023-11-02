import { Topic } from "@webiny/pubsub/types";
import { PbContext } from "@webiny/api-page-builder/types";
import { FormBuilderContext } from "@webiny/api-form-builder/types";
import {
    ExportRevisionType,
    ImportExportTask,
    ImportExportTaskStatus,
    ImportExportTaskStorageOperations,
    ImportExportTaskStorageOperationsListParams
} from "~/types";

export interface ExportPagesParams {
    ids?: string[];
    revisionType: ExportRevisionType;
    where?: {
        category?: string;
        status?: string;
        tags?: { query: string[]; rule?: "any" | "all" };
        [key: string]: any;
    };
    search?: { query?: string };
    sort?: string[];
}

export interface ImportPagesParams {
    category: string;
    zipFileUrl: string;
    meta?: Record<string, any>;
}

/**
 * @category Lifecycle events
 */
export interface OnPagesBeforeExportTopicParams {
    params: ExportPagesParams;
}

/**
 * @category Lifecycle events
 */
export interface OnPagesAfterExportTopicParams {
    params: ExportPagesParams;
}

/**
 * @category Lifecycle events
 */
export interface OnPagesBeforeImportTopicParams {
    params: ImportPagesParams;
}

/**
 * @category Lifecycle events
 */
export interface OnPagesAfterImportTopicParams {
    params: ImportPagesParams;
}

export type PagesImportExportCrud = {
    exportPages(params: ExportPagesParams): Promise<{ task: ImportExportTask }>;
    importPages(params: ImportPagesParams): Promise<{ task: ImportExportTask }>;

    onPagesBeforeExport: Topic<OnPagesBeforeExportTopicParams>;
    onPagesAfterExport: Topic<OnPagesAfterExportTopicParams>;
    onPagesBeforeImport: Topic<OnPagesBeforeImportTopicParams>;
    onPagesAfterImport: Topic<OnPagesAfterImportTopicParams>;
};

export interface ExportBlocksParams {
    ids?: string[];
    sort?: string[];
    where?: {
        blockCategory?: string;
    };
}

export interface ImportBlocksParams {
    zipFileUrl: string;
}

/**
 * @category Lifecycle events
 */
export interface OnBlocksBeforeExportTopicParams {
    params: ExportBlocksParams;
}

/**
 * @category Lifecycle events
 */
export interface OnBlocksAfterExportTopicParams {
    params: ExportBlocksParams;
}

/**
 * @category Lifecycle events
 */
export interface OnBlocksBeforeImportTopicParams {
    params: ImportBlocksParams;
}

/**
 * @category Lifecycle events
 */
export interface OnBlocksAfterImportTopicParams {
    params: ImportBlocksParams;
}

export type BlocksImportExportCrud = {
    exportBlocks(params: ExportBlocksParams): Promise<{ task: ImportExportTask }>;
    importBlocks(params: ImportBlocksParams): Promise<{ task: ImportExportTask }>;

    onBlocksBeforeExport: Topic<OnBlocksBeforeExportTopicParams>;
    onBlocksAfterExport: Topic<OnBlocksAfterExportTopicParams>;
    onBlocksBeforeImport: Topic<OnBlocksBeforeImportTopicParams>;
    onBlocksAfterImport: Topic<OnBlocksAfterImportTopicParams>;
};

export interface ExportTemplatesParams {
    ids?: string[];
    sort?: string[];
}

export interface ImportTemplatesParams {
    zipFileUrl: string;
}

/**
 * @category Lifecycle events
 */
export interface OnTemplatesBeforeExportTopicParams {
    params: ExportTemplatesParams;
}

/**
 * @category Lifecycle events
 */
export interface OnTemplatesAfterExportTopicParams {
    params: ExportTemplatesParams;
}

/**
 * @category Lifecycle events
 */
export interface OnTemplatesBeforeImportTopicParams {
    params: ImportTemplatesParams;
}

/**
 * @category Lifecycle events
 */
export interface OnTemplatesAfterImportTopicParams {
    params: ImportTemplatesParams;
}

export type TemplatesImportExportCrud = {
    exportTemplates(params: ExportTemplatesParams): Promise<{ task: ImportExportTask }>;
    importTemplates(params: ImportTemplatesParams): Promise<{ task: ImportExportTask }>;

    onTemplatesBeforeExport: Topic<OnTemplatesBeforeExportTopicParams>;
    onTemplatesAfterExport: Topic<OnTemplatesAfterExportTopicParams>;
    onTemplatesBeforeImport: Topic<OnTemplatesBeforeImportTopicParams>;
    onTemplatesAfterImport: Topic<OnTemplatesAfterImportTopicParams>;
};

export interface ExportFormsParams {
    ids?: string[];
    revisionType: ExportRevisionType;
    search?: { query?: string };
    sort?: string[];
}

export interface ImportFormsParams {
    zipFileUrl: string;
}

/**
 * @category Lifecycle events
 */
export interface OnFormsBeforeExportTopicParams {
    params: ExportFormsParams;
}

/**
 * @category Lifecycle events
 */
export interface OnFormsAfterExportTopicParams {
    params: ExportFormsParams;
}

/**
 * @category Lifecycle events
 */
export interface OnFormsBeforeImportTopicParams {
    params: ImportFormsParams;
}

/**
 * @category Lifecycle events
 */
export interface OnFormsAfterImportTopicParams {
    params: ImportFormsParams;
}

export type FormsImportExportCrud = {
    exportForms(params: ExportFormsParams): Promise<{ task: ImportExportTask }>;
    importForms(params: ImportFormsParams): Promise<{ task: ImportExportTask }>;

    onFormsBeforeExport: Topic<OnFormsBeforeExportTopicParams>;
    onFormsAfterExport: Topic<OnFormsAfterExportTopicParams>;
    onFormsBeforeImport: Topic<OnFormsBeforeImportTopicParams>;
    onFormsAfterImport: Topic<OnFormsAfterImportTopicParams>;
};

type ImportExportTaskCreateData = Omit<ImportExportTask, "id" | "createdOn" | "createdBy">;

export type ImportExportTaskCrud = {
    /**
     * To be used internally in our code.
     * @internal
     */
    storageOperations: ImportExportTaskStorageOperations;

    getTask(id: string): Promise<ImportExportTask | null>;
    listTasks(params?: ImportExportTaskStorageOperationsListParams): Promise<ImportExportTask[]>;
    createTask(data: Partial<ImportExportTaskCreateData>): Promise<ImportExportTask>;
    updateTask(id: string, data: Partial<ImportExportTaskCreateData>): Promise<ImportExportTask>;
    updateStats(
        id: string,
        data: {
            prevStatus: ImportExportTaskStatus;
            nextStatus: ImportExportTaskStatus;
        }
    ): Promise<ImportExportTask>;
    deleteTask(id: string): Promise<ImportExportTask>;
    getSubTask(id: string, subtaskId: string): Promise<ImportExportTask | null>;
    listSubTasks(
        id: string,
        status: ImportExportTaskStatus,
        limit: number
    ): Promise<ImportExportTask[]>;
    createSubTask(
        id: string,
        subTaskId: string,
        data: Partial<ImportExportTaskCreateData>
    ): Promise<ImportExportTask>;
    updateSubTask(
        id: string,
        subTaskId: string,
        data: Partial<ImportExportTaskCreateData>
    ): Promise<ImportExportTask>;
};

export interface PbImportExportContext extends PbContext {
    pageBuilder: PbContext["pageBuilder"] & {
        pages: PagesImportExportCrud;
        blocks: BlocksImportExportCrud;
        templates: TemplatesImportExportCrud;
        importExportTask: ImportExportTaskCrud;
    };
    formBuilder: FormBuilderContext["formBuilder"] & {
        forms: FormsImportExportCrud;
    };
}

export interface ImportExportPluginsParams {
    storageOperations: ImportExportTaskStorageOperations;
}
