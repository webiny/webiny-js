import { createAbstraction } from "@webiny/feature/api";

export interface ISchedulerPermissionsParams {
    /**
     * The namespace being accessed.
     */
    namespace: string;
    /**
     * `true` when `namespace` is only a prefix (listing with `namespace_startsWith`), so the
     * check must cover every namespace starting with it.
     */
    startsWith?: boolean;
}

export interface ISchedulerPermissions {
    canHandle(namespace: string): boolean;
    canRead(params: ISchedulerPermissionsParams): Promise<boolean>;
    onlyOwnRecords(params: ISchedulerPermissionsParams): Promise<boolean>;
}

export const SchedulerPermissions =
    createAbstraction<ISchedulerPermissions>("Scheduler/Permissions");

export namespace SchedulerPermissions {
    export type Interface = ISchedulerPermissions;
    export type Params = ISchedulerPermissionsParams;
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
