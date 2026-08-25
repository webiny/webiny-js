import { createAbstraction } from "@webiny/feature/api";

export interface ISchedulerPermissions {
    canRead(): Promise<boolean>;
    onlyOwnRecords(): Promise<boolean>;
}

export const SchedulerPermissions =
    createAbstraction<ISchedulerPermissions>("Scheduler/Permissions");

export namespace SchedulerPermissions {
    export type Interface = ISchedulerPermissions;
}
