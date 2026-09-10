import { createPermissionsAbstraction } from "@webiny/api-core/exports/api/security.js";
import type { Permissions } from "@webiny/api-core/exports/api/security.js";
import { ACTIVITY_LOG_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const ActivityLogPermissions = createPermissionsAbstraction(ACTIVITY_LOG_PERMISSIONS_SCHEMA);

export namespace ActivityLogPermissions {
    export type Interface = Permissions<typeof ACTIVITY_LOG_PERMISSIONS_SCHEMA>;
}
