import type { CmsIdentity, CmsModel } from "@webiny/app-headless-cms-common/types";

export type { CmsIdentity, CmsModel };

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

export interface SchedulerEntry {
    id: string;
    targetId: string;
    model: Pick<CmsModel, "modelId">;
    scheduledBy: CmsIdentity;
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
