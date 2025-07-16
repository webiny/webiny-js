import type {
    CmsEntryListSort,
    CmsEntryMeta,
    CmsIdentity,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";

export interface ISchedulerInputImmediately {
    immediately: true;
    dateOn?: never;
    type: "publish" | "unpublish";
}

export interface ISchedulerInputScheduled {
    immediately?: never;
    dateOn: Date;
    type: "publish" | "unpublish";
}

export type ISchedulerInput = ISchedulerInputScheduled | ISchedulerInputImmediately;

export interface IScheduleRecord {
    id: string;
    targetId: string;
    model: CmsModel;
    scheduledBy: CmsIdentity;
    publishOn: Date | undefined;
    unpublishOn: Date | undefined;
    type: "publish" | "unpublish";
    title: string;
}

export interface ISchedulerListResponse {
    data: IScheduleRecord[];
    meta: CmsEntryMeta;
}

export interface ISchedulerListParams {
    where: Record<string, any> | undefined;
    sort: CmsEntryListSort | undefined;
    limit: number | undefined;
    after: string | undefined;
}

export interface IScheduler {
    schedule(id: string, input: ISchedulerInput): Promise<IScheduleRecord>;
    cancel(id: string): Promise<void>;
    getScheduled(id: string): Promise<IScheduleRecord | null>;
    listScheduled(params: ISchedulerListParams): Promise<ISchedulerListResponse>;
}

export interface IScheduleEntryValues {
    targetId: string;
    targetModelId: string;
    scheduledBy: CmsIdentity;
    dateOn: string;
    type: "publish" | "unpublish";
    title: string;
}

export interface IScheduleExecutor {
    schedule(targetId: string, input: ISchedulerInput): Promise<IScheduleRecord>;
    cancel(id: string): Promise<void>;
}

export interface IScheduleFetcher {
    getScheduled(targetId: string): Promise<IScheduleRecord | null>;
    listScheduled(params: ISchedulerListParams): Promise<ISchedulerListResponse>;
}

export interface IScheduleActionScheduleParams {
    targetId: string;
    scheduleRecordId: string;
    input: ISchedulerInput;
}
export interface IScheduleAction {
    canHandle(input: ISchedulerInput): boolean;
    schedule(params: IScheduleActionScheduleParams): Promise<IScheduleRecord>;
}
