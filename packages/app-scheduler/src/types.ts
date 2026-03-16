import type { CmsIdentity } from "@webiny/app-headless-cms-common/types/index.js";
import type { TableRow } from "@webiny/app-aco";

type SchedulerIdentity = Pick<CmsIdentity, "id" | "displayName" | "type">;

export type { SchedulerIdentity };

export enum ScheduleActionType {
    publish = "publish",
    unpublish = "unpublish"
}

export interface SchedulerErrorResponse {
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

export interface SchedulerEntry {
    id: string;
    targetId: string;
    namespace: string;
    scheduledBy: SchedulerIdentity;
    publishOn?: Date;
    unpublishOn?: Date;
    actionType: ScheduleActionType;
    title: string;
}

export enum LoadingActions {
    get = "GET",
    list = "LIST",
    listMore = "LIST_MORE",
    delete = "DELETE",
    create = "CREATE"
}

export type SchedulerEntryTableRow = TableRow<SchedulerEntry>;
