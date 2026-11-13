import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ScheduledActionType } from "@webiny/api-scheduler/exports/api/scheduler.js";

/**
 * An additional rule for scheduling an action on an entry, on top of the Headless CMS permissions.
 * When any guard denies, the action cannot be scheduled or cancelled.
 */
export interface IScheduleEntryGuardParams {
    model: CmsModel;
    entry: CmsEntry;
    actionType: ScheduledActionType;
}

export interface IScheduleEntryGuard {
    /** May the current identity schedule the given action on the entry? */
    canSchedule(params: IScheduleEntryGuardParams): Promise<boolean>;
}

export const ScheduleEntryGuard = createAbstraction<IScheduleEntryGuard>(
    "HeadlessCmsScheduler/ScheduleEntryGuard"
);

export namespace ScheduleEntryGuard {
    export type Interface = IScheduleEntryGuard;
    export type Params = IScheduleEntryGuardParams;
}
