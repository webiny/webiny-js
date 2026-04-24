import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { TM_PERMISSIONS_SCHEMA } from "~/admin/domain/permissionsSchema.js";

export const TmPermissions = createPermissionsAbstraction(TM_PERMISSIONS_SCHEMA);

export namespace TmPermissions {
    export type Interface = Permissions<typeof TM_PERMISSIONS_SCHEMA>;
}
