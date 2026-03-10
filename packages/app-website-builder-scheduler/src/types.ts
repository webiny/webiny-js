import type { TableRow } from "@webiny/app-aco";

export enum ScheduleType {
    publish = "publish",
    unpublish = "unpublish"
}

export interface CmsErrorResponse {
    code: string;
    message: string;
    data?: Record<string, any>;
    stack?: string;
}

export interface SchedulerMetaResponse {
    totalCount: number;
    cursor: string | null;
    hasMoreItems: boolean;
}

export interface WbSchedulerEntry {
    id: string;
    targetId: string;
    scheduledBy: { id: string; displayName: string; type: string };
    publishOn?: Date;
    unpublishOn?: Date;
    type: ScheduleType;
    title: string;
}

export enum LoadingActions {
    get = "GET",
    list = "LIST",
    listMore = "LIST_MORE",
    delete = "DELETE",
    create = "CREATE"
}

export type WbSchedulerEntryTableRow = TableRow<WbSchedulerEntry>;
