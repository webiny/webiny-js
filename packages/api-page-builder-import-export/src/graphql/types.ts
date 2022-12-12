import { PbContext } from "@webiny/api-page-builder/types";
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
}

export type PagesImportExportCrud = {
    exportPages(params: ExportPagesParams): Promise<{ task: ImportExportTask }>;
    importPages(params: ImportPagesParams): Promise<{ task: ImportExportTask }>;
};

export interface ExportBlocksParams {
    ids?: string[];
    sort?: string[];
    where?: {
        blockCategory?: string;
    };
}

export interface ImportBlocksParams {
    category: string;
    zipFileUrl: string;
}

export type BlocksImportExportCrud = {
    exportBlocks(params: ExportBlocksParams): Promise<{ task: ImportExportTask }>;
    importBlocks(params: ImportBlocksParams): Promise<{ task: ImportExportTask }>;
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
        importExportTask: ImportExportTaskCrud;
    };
}

export interface ImportExportPluginsParams {
    storageOperations: ImportExportTaskStorageOperations;
}
