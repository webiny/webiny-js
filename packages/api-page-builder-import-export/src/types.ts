export * from "./graphql/types";

// Entities.
export enum PageExportRevisionType {
    PUBLISHED = "published",
    LATEST = "latest"
}

export enum PageImportExportTaskStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}

export interface PageImportExportTaskStats {
    [PageImportExportTaskStatus.PENDING]: number;
    [PageImportExportTaskStatus.PROCESSING]: number;
    [PageImportExportTaskStatus.COMPLETED]: number;
    [PageImportExportTaskStatus.FAILED]: number;
    total: number;
}

export interface PageImportExportTask {
    id: string;
    parent: string;
    status: PageImportExportTaskStatus;
    data: Record<string, any>;
    stats: PageImportExportTaskStats;
    error: Record<string, any>;
    input: Record<string, any>;
    createdOn: string;
    createdBy: {
        type: string;
        id: string;
        displayName: string;
    };
    tenant: string;
    locale: string;
}

export interface File {
    id: string;
    src: string;
}

export interface MetaResponse {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

/**
 * @category StorageOperations
 * @category PageImportExportTaskStorageOperations
 */
export interface PageImportExportTaskStorageOperationsGetParams {
    where: {
        id: string;
        tenant: string;
        locale: string;
    };
}

/**
 * @category StorageOperations
 * @category PageImportExportTaskStorageOperations
 */
export interface PageImportExportTaskStorageOperationsListParams {
    where: {
        tenant: string;
        locale: string;
    };
    sort?: string[];
    limit?: number;
    after?: string | null;
}

/**
 * @category StorageOperations
 * @category PageImportExportTaskStorageOperations
 */
export type PageImportExportTaskStorageOperationsListResponse = [
    PageImportExportTask[],
    MetaResponse
];

/**
 * @category StorageOperations
 * @category PageImportExportTaskStorageOperations
 */
export interface PageImportExportTaskStorageOperationsCreateParams {
    input: Record<string, any>;
    task: PageImportExportTask;
}

/**
 * @category StorageOperations
 * @category PageImportExportTaskStorageOperations
 */
export interface PageImportExportTaskStorageOperationsUpdateParams {
    input: Record<string, any>;
    original: PageImportExportTask;
    task: PageImportExportTask;
}

/**
 * @category StorageOperations
 * @category PageImportExportTaskStorageOperations
 */
export interface PageImportExportTaskStorageOperationsDeleteParams {
    task: PageImportExportTask;
}

/**
 * @category StorageOperations
 * @category PageImportExportTaskStorageOperations
 */
export interface PageImportExportTaskStorageOperationsGetSubTaskParams {
    where: {
        id: string;
        parent: string;
        tenant: string;
        locale: string;
    };
}

/**
 * @category StorageOperations
 * @category PageImportExportTaskStorageOperations
 */
export interface PageImportExportTaskStorageOperationsListSubTaskParams {
    where: {
        tenant: string;
        locale: string;
        parent: string;
        status: PageImportExportTaskStatus;
        createdBy?: string;
    };
    sort?: string[];
    limit?: number;
    after?: string | null;
}

/**
 * @category StorageOperations
 * @category PageImportExportTaskStorageOperations
 */
export type PageImportExportTaskStorageOperationsListSubTaskResponse = [
    PageImportExportTask[],
    MetaResponse
];

/**
 * @category StorageOperations
 * @category PageImportExportTaskStorageOperations
 */
export interface PageImportExportTaskStorageOperationsCreateSubTaskParams {
    input: Record<string, any>;
    subTask: PageImportExportTask;
}

/**
 * @category StorageOperations
 * @category PageImportExportTaskStorageOperations
 */
export interface PageImportExportTaskStorageOperationsUpdateSubTaskParams {
    input: Record<string, any>;
    original: PageImportExportTask;
    subTask: PageImportExportTask;
}

/**
 * @category StorageOperations
 * @category PageImportExportTaskStorageOperations
 */
export interface PageImportExportTaskStorageOperationsUpdateTaskStatsParams {
    input: {
        prevStatus: PageImportExportTaskStatus;
        nextStatus: PageImportExportTaskStatus;
    };
    original: PageImportExportTask;
}

/**
 * @category StorageOperations
 * @category PageImportExportTaskStorageOperations
 */
export interface PageImportExportTaskStorageOperations {
    /**
     * Get a single page import export task item by given params.
     */
    getTask(
        params: PageImportExportTaskStorageOperationsGetParams
    ): Promise<PageImportExportTask | null>;

    /**
     * Get all page import export tasks by given params.
     */
    listTasks(
        params: PageImportExportTaskStorageOperationsListParams
    ): Promise<PageImportExportTaskStorageOperationsListResponse>;

    createTask(
        params: PageImportExportTaskStorageOperationsCreateParams
    ): Promise<PageImportExportTask>;

    updateTask(
        params: PageImportExportTaskStorageOperationsUpdateParams
    ): Promise<PageImportExportTask>;

    deleteTask(
        params: PageImportExportTaskStorageOperationsDeleteParams
    ): Promise<PageImportExportTask>;

    updateTaskStats(
        params: PageImportExportTaskStorageOperationsUpdateTaskStatsParams
    ): Promise<PageImportExportTask>;

    /**
     * Get a single page import export sub-task item by given params.
     */
    getSubTask(
        params: PageImportExportTaskStorageOperationsGetSubTaskParams
    ): Promise<PageImportExportTask | null>;

    /**
     * Get all page import export sub-tasks by given params.
     */
    listSubTasks(
        params: PageImportExportTaskStorageOperationsListSubTaskParams
    ): Promise<PageImportExportTaskStorageOperationsListSubTaskResponse>;

    createSubTask(
        params: PageImportExportTaskStorageOperationsCreateSubTaskParams
    ): Promise<PageImportExportTask>;

    updateSubTask(
        params: PageImportExportTaskStorageOperationsUpdateSubTaskParams
    ): Promise<PageImportExportTask>;
}
