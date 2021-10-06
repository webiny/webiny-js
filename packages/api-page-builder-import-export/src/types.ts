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
}

export type File = {
    id: string;
    src: string;
};
