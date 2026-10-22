import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { FRONTEND_PERMISSIONS_SCHEMA } from "~/admin/domain/permissionsSchema.js";

export const FrontendPermissions = createPermissionsAbstraction(FRONTEND_PERMISSIONS_SCHEMA);

export namespace FrontendPermissions {
    export type Interface = Permissions<typeof FRONTEND_PERMISSIONS_SCHEMA>;
}
