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
     * The permissions of the app that owns `namespace`. When no app claims the namespace, or there is
     * no namespace at all, the result only lets full-access identities through.
     */
    forNamespace(namespace: string | undefined): ISchedulerPermissions;
}

export const SchedulerPermissionsResolver = createAbstraction<ISchedulerPermissionsResolver>(
    "Scheduler/PermissionsResolver"
);

export namespace SchedulerPermissionsResolver {
    export type Interface = ISchedulerPermissionsResolver;
}
