import { PagesCrud, PbContext } from "@webiny/api-page-builder/types";
import {
    PageExportRevisionType,
    PageImportExportTask,
    PageImportExportTaskStatus,
    PageImportExportTaskStorageOperations,
    PageImportExportTaskStorageOperationsListParams
} from "~/types";

export type PagesImportExportCrud = {
    exportPages(
        ids: string[],
        revisionType: PageExportRevisionType
    ): Promise<{ task: PageImportExportTask }>;
    importPages(
        category: string,
        data: Record<string, any>
    ): Promise<{ task: PageImportExportTask }>;
};

type PageImportExportTaskCreateData = Omit<PageImportExportTask, "id" | "createdOn" | "createdBy">;

export type PageImportExportTaskCrud = {
    /**
     * To be used internally in our code.
     * @internal
     */
    storageOperations: PageImportExportTaskStorageOperations;

    get(id: string): Promise<PageImportExportTask>;
    list(params?: PageImportExportTaskStorageOperationsListParams): Promise<PageImportExportTask[]>;
    create(data: Partial<PageImportExportTaskCreateData>): Promise<PageImportExportTask>;
    update(
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
    delete(id: string): Promise<PageImportExportTask>;
    getSubTask(id: string, subtaskId: string): Promise<PageImportExportTask>;
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
        pages: PagesCrud & PagesImportExportCrud;
        pageImportExportTask: PageImportExportTaskCrud;
    };
}

export interface PageImportExportPluginsParams {
    storageOperations: PageImportExportTaskStorageOperations;
}
