export * from "./graphql/types";

// Entities.
export enum ExportRevisionType {
    PUBLISHED = "published",
    LATEST = "latest"
}

export enum ImportExportTaskStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}

export interface ImportExportTaskStats {
    [ImportExportTaskStatus.PENDING]: number;
    [ImportExportTaskStatus.PROCESSING]: number;
    [ImportExportTaskStatus.COMPLETED]: number;
    [ImportExportTaskStatus.FAILED]: number;
    total: number;
}

interface CreatedBy {
    id: string;
    type: string;
    displayName: string | null;
}

export interface ImportExportTask {
    id: string;
    parent: string;
    status: ImportExportTaskStatus;
    data: Record<string, any>;
    stats: ImportExportTaskStats;
    error: Record<string, any>;
    input: Record<string, any>;
    createdOn: string;
    createdBy: CreatedBy;
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
 * @category ImportExportTaskStorageOperations
 */
export interface ImportExportTaskStorageOperationsGetParams {
    where: {
        id: string;
        tenant: string;
        locale: string;
    };
}

/**
 * @category StorageOperations
 * @category ImportExportTaskStorageOperations
 */
export interface ImportExportTaskStorageOperationsListParams {
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
 * @category ImportExportTaskStorageOperations
 */
export type ImportExportTaskStorageOperationsListResponse = [ImportExportTask[], MetaResponse];

/**
 * @category StorageOperations
 * @category ImportExportTaskStorageOperations
 */
export interface ImportExportTaskStorageOperationsCreateParams {
    input: Record<string, any>;
    task: ImportExportTask;
}

/**
 * @category StorageOperations
 * @category ImportExportTaskStorageOperations
 */
export interface ImportExportTaskStorageOperationsUpdateParams {
    input: Record<string, any>;
    original: ImportExportTask;
    task: ImportExportTask;
}

/**
 * @category StorageOperations
 * @category ImportExportTaskStorageOperations
 */
export interface ImportExportTaskStorageOperationsDeleteParams {
    task: ImportExportTask;
}

/**
 * @category StorageOperations
 * @category ImportExportTaskStorageOperations
 */
export interface ImportExportTaskStorageOperationsGetSubTaskParams {
    where: {
        id: string;
        parent: string;
        tenant: string;
        locale: string;
    };
}

/**
 * @category StorageOperations
 * @category ImportExportTaskStorageOperations
 */
export interface ImportExportTaskStorageOperationsListSubTaskParams {
    where: {
        tenant: string;
        locale: string;
        parent: string;
        status: ImportExportTaskStatus;
        createdBy?: string;
    };
    sort?: string[];
    limit?: number;
    after?: string | null;
}

/**
 * @category StorageOperations
 * @category ImportExportTaskStorageOperations
 */
export type ImportExportTaskStorageOperationsListSubTaskResponse = [
    ImportExportTask[],
    MetaResponse
];

/**
 * @category StorageOperations
 * @category ImportExportTaskStorageOperations
 */
export interface ImportExportTaskStorageOperationsCreateSubTaskParams {
    input: Record<string, any>;
    subTask: ImportExportTask;
}

/**
 * @category StorageOperations
 * @category ImportExportTaskStorageOperations
 */
export interface ImportExportTaskStorageOperationsUpdateSubTaskParams {
    input: Record<string, any>;
    original: ImportExportTask;
    subTask: ImportExportTask;
}

/**
 * @category StorageOperations
 * @category ImportExportTaskStorageOperations
 */
export interface ImportExportTaskStorageOperationsUpdateTaskStatsParams {
    input: {
        prevStatus: ImportExportTaskStatus;
        nextStatus: ImportExportTaskStatus;
    };
    original: ImportExportTask;
}

/**
 * @category StorageOperations
 * @category ImportExportTaskStorageOperations
 */
export interface ImportExportTaskStorageOperations {
    /**
     * Get a single  import export task item by given params.
     */
    getTask(params: ImportExportTaskStorageOperationsGetParams): Promise<ImportExportTask | null>;

    /**
     * Get all  import export tasks by given params.
     */
    listTasks(
        params: ImportExportTaskStorageOperationsListParams
    ): Promise<ImportExportTaskStorageOperationsListResponse>;

    createTask(params: ImportExportTaskStorageOperationsCreateParams): Promise<ImportExportTask>;

    updateTask(params: ImportExportTaskStorageOperationsUpdateParams): Promise<ImportExportTask>;

    deleteTask(params: ImportExportTaskStorageOperationsDeleteParams): Promise<ImportExportTask>;

    updateTaskStats(
        params: ImportExportTaskStorageOperationsUpdateTaskStatsParams
    ): Promise<ImportExportTask>;

    /**
     * Get a single  import export sub-task item by given params.
     */
    getSubTask(
        params: ImportExportTaskStorageOperationsGetSubTaskParams
    ): Promise<ImportExportTask | null>;

    /**
     * Get all  import export sub-tasks by given params.
     */
    listSubTasks(
        params: ImportExportTaskStorageOperationsListSubTaskParams
    ): Promise<ImportExportTaskStorageOperationsListSubTaskResponse>;

    createSubTask(
        params: ImportExportTaskStorageOperationsCreateSubTaskParams
    ): Promise<ImportExportTask>;

    updateSubTask(
        params: ImportExportTaskStorageOperationsUpdateSubTaskParams
    ): Promise<ImportExportTask>;
}

export interface FileUploadsData {
    /**
     * Location of export data file. Export data contains the relevant entity data (block, page, template), and an
     * array of file objects, exported from the DB, that need to be imported.
     *
     * Example:
     * 'IMPORTS/8lf6y7xp5/8lf6x9v68-header-1/8lf6x9v69-header-1/Header #1.json'
     */
    data: string;
    /**
     * Example:
     * '8ldspraka-9l9iaffak-1.jpeg': 'IMPORTS/8lf6y7xp5/8lf6x9v68-header-1/assets/8ldspraka-9l9iaffak-1.jpeg',
     * '8ldwyq8ao-pb-editor-page-element-rzfKWtdTWN.png': 'IMPORTS/8lf6y7xp5/8lf6x9v69-header-1/assets/8ldwyq8ao-pb-editor-page-element-rzfKWtdTWN.png'
     */
    assets: Record<string, string>;
}

export interface ImportData {
    assets: Record<string, string>;
    data: string;
    key: string;
}
