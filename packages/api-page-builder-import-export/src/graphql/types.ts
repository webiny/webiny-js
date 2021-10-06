import { PagesCrud, PbContext } from "@webiny/api-page-builder/types";
import { PageExportRevisionType, PageImportExportTask, PageImportExportTaskStatus } from "~/types";

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
    get(id: string): Promise<PageImportExportTask>;
    list(): Promise<PageImportExportTask[]>;
    create(data: Partial<PageImportExportTaskCreateData>): Promise<PageImportExportTask>;
    update(
        id: string,
        data: Partial<PageImportExportTaskCreateData>
    ): Promise<PageImportExportTask>;
    delete(id: string): Promise<PageImportExportTask>;
    getSubTask(id: string, subtaskId: string): Promise<PageImportExportTask>;
    getSubTaskByStatus(
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
