import { createPermissionsAbstraction } from "@webiny/api-core/exports/api/security.js";
import type { Permissions } from "@webiny/api-core/exports/api/security.js";
import { SCHEDULER_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const SchedulerPermissions = createPermissionsAbstraction(SCHEDULER_PERMISSIONS_SCHEMA);

export namespace SchedulerPermissions {
    export type Interface = Permissions<typeof SCHEDULER_PERMISSIONS_SCHEMA>;
}
