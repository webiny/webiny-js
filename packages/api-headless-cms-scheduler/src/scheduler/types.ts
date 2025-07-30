import type {
    CmsEntryListSort,
    CmsEntryMeta,
    CmsIdentity,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";

export enum ScheduleType {
    publish = "publish",
    unpublish = "unpublish"
}

export type DateISOString =
    `${number}-${number}-${number}T${number}:${number}:${number}.${number}Z`;
/**
 * A date when the action is to be scheduled.
 */
export type ScheduledOnType = Date;
/**
 * A custom date when the action is to be set as done (publishedOn and related dates).
 */
export type DateOnType = Date;

export interface ISchedulerInputImmediately {
    immediately: true;
    scheduleOn?: never;
    type: ScheduleType;
}

export interface ISchedulerInputScheduled {
    immediately?: false;
    scheduleOn: ScheduledOnType;
    type: ScheduleType;
}

export type ISchedulerInput = ISchedulerInputScheduled | ISchedulerInputImmediately;

export interface IScheduleRecord {
    id: string;
    targetId: string;
    model: CmsModel;
    scheduledBy: CmsIdentity;
    // dateOn: DateOnType | undefined;
    publishOn: ScheduledOnType | undefined;
    unpublishOn: ScheduledOnType | undefined;
    type: ScheduleType;
    title: string;
}

export interface ISchedulerListResponse {
    data: IScheduleRecord[];
    meta: CmsEntryMeta;
}

export interface ISchedulerListParamsWhere {
    targetId?: string;
    targetEntryId?: string;
    type?: ScheduleType;
    scheduledBy?: string;
    scheduledOn?: DateISOString;
    scheduledOn_gte?: DateISOString;
    scheduledOn_lte?: DateISOString;
}

export interface ISchedulerListParams {
    where: ISchedulerListParamsWhere;
    sort: CmsEntryListSort | undefined;
    limit: number | undefined;
    after: string | undefined;
}

export interface IScheduler {
    schedule(id: string, input: ISchedulerInput): Promise<IScheduleRecord>;
    cancel(id: string): Promise<IScheduleRecord>;
    getScheduled(id: string): Promise<IScheduleRecord | null>;
    listScheduled(params: ISchedulerListParams): Promise<ISchedulerListResponse>;
}

export interface IScheduleEntryValues {
    targetId: string;
    targetModelId: string;
    scheduledBy: CmsIdentity;
    // dateOn: DateISOString | undefined;
    scheduledOn: DateISOString;
    type: string;
    title: string;
    error?: string;
}

export interface IScheduleExecutor {
    schedule(targetId: string, input: ISchedulerInput): Promise<IScheduleRecord>;
    cancel(id: string): Promise<IScheduleRecord>;
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
    canHandle(input: Pick<ISchedulerInput, "type">): boolean;
    schedule(params: IScheduleActionScheduleParams): Promise<IScheduleRecord>;
    cancel(id: string): Promise<void>;
    reschedule(original: IScheduleRecord, input: ISchedulerInput): Promise<IScheduleRecord>;
}
