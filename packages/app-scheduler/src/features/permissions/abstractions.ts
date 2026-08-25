import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { SCHEDULER_PERMISSIONS_SCHEMA } from "~/permissions.js";

export const SchedulerPermissions = createPermissionsAbstraction(SCHEDULER_PERMISSIONS_SCHEMA);

export namespace SchedulerPermissions {
    export type Interface = Permissions<typeof SCHEDULER_PERMISSIONS_SCHEMA>;
}
