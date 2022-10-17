import { PbContext } from "@webiny/api-page-builder/types";
import {
    PageExportRevisionType,
    PageImportExportTask,
    PageImportExportTaskStatus,
    PageImportExportTaskStorageOperations,
    PageImportExportTaskStorageOperationsListParams
} from "~/types";

export interface ExportPagesParams {
    ids?: string[];
    revisionType: PageExportRevisionType;
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
    exportPages(params: ExportPagesParams): Promise<{ task: PageImportExportTask }>;
    importPages(params: ImportPagesParams): Promise<{ task: PageImportExportTask }>;
};

type PageImportExportTaskCreateData = Omit<PageImportExportTask, "id" | "createdOn" | "createdBy">;

export type PageImportExportTaskCrud = {
    /**
     * To be used internally in our code.
     * @internal
     */
    storageOperations: PageImportExportTaskStorageOperations;

    getTask(id: string): Promise<PageImportExportTask | null>;
    listTasks(
        params?: PageImportExportTaskStorageOperationsListParams
    ): Promise<PageImportExportTask[]>;
    createTask(data: Partial<PageImportExportTaskCreateData>): Promise<PageImportExportTask>;
    updateTask(
        id: string,
        data: Partial<PageImportExportTaskCreateData>
    ): Promise<PageImportExportTask>;
    updateStats(
        id: string,
        data: {
            prevStatus: PageImportExportTaskStatus;
            nextStatus: PageImportExportTaskStatus;
        }
    ): Promise<PageImportExportTask>;
    deleteTask(id: string): Promise<PageImportExportTask>;
    getSubTask(id: string, subtaskId: string): Promise<PageImportExportTask | null>;
    listSubTasks(
        id: string,
        status: PageImportExportTaskStatus,
        limit: number
    ): Promise<PageImportExportTask[]>;
    createSubTask(
        id: string,
        subTaskId: string,
        data: Partial<PageImportExportTaskCreateData>
    ): Promise<PageImportExportTask>;
    updateSubTask(
        id: string,
        subTaskId: string,
        data: Partial<PageImportExportTaskCreateData>
    ): Promise<PageImportExportTask>;
};

export interface PbPageImportExportContext extends PbContext {
    pageBuilder: PbContext["pageBuilder"] & {
        pages: PagesImportExportCrud;
        pageImportExportTask: PageImportExportTaskCrud;
    };
}

export interface PageImportExportPluginsParams {
    storageOperations: PageImportExportTaskStorageOperations;
}
