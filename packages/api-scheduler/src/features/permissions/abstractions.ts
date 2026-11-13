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
    /**
     * Returns the permissions for the given namespace. A namespace without a registered
     * `SchedulerPermissions` implementation gets permissions that deny everything.
     */
    forNamespace(namespace: string): ISchedulerPermissions;
}

export const SchedulerPermissionsResolver = createAbstraction<ISchedulerPermissionsResolver>(
    "Scheduler/PermissionsResolver"
);

export namespace SchedulerPermissionsResolver {
    export type Interface = ISchedulerPermissionsResolver;
}
