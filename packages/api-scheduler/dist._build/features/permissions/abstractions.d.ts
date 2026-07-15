import type { Permissions } from "@webiny/api-core/exports/api/security.js";
import { SCHEDULER_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
export declare const SchedulerPermissions: import("@webiny/di").Abstraction<import("@webiny/api-core/features/security/permissions/types").PermissionsTyped<{
    readonly prefix: "scheduler";
    readonly fullAccess: true;
    readonly entities: readonly [{
        readonly id: "action";
        readonly permission: "scheduler.action";
        readonly scopes: readonly ["full", "own"];
    }];
}>>;
export declare namespace SchedulerPermissions {
    type Interface = Permissions<typeof SCHEDULER_PERMISSIONS_SCHEMA>;
}
