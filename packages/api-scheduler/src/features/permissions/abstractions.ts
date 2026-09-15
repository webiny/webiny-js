import { createAbstraction } from "@webiny/feature/api";

export interface ISchedulerPermissions {
    canHandle(namespace: string): boolean;
    canRead(): Promise<boolean>;
    onlyOwnRecords(): Promise<boolean>;
}

export const SchedulerPermissions =
    createAbstraction<ISchedulerPermissions>("Scheduler/Permissions");

export namespace SchedulerPermissions {
    export type Interface = ISchedulerPermissions;
}

export interface ISchedulerPermissionsResolver {
    forNamespace(namespace: string): ISchedulerPermissions | undefined;
}

export const SchedulerPermissionsResolver = createAbstraction<ISchedulerPermissionsResolver>(
    "Scheduler/PermissionsResolver"
);

export namespace SchedulerPermissionsResolver {
    export type Interface = ISchedulerPermissionsResolver;
}
