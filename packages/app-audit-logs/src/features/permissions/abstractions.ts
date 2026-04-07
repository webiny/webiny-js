import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin.js";
import type { Permissions } from "@webiny/app-admin/exports/admin.js";
import { AL_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const AuditLogsPermissions = createPermissionsAbstraction(AL_PERMISSIONS_SCHEMA);

export namespace AuditLogsPermissions {
    export type Interface = Permissions<typeof AL_PERMISSIONS_SCHEMA>;
}
