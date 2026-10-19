import { createPermissionsAbstraction } from "@webiny/app-admin/exports/admin/security.js";
import type { Permissions } from "@webiny/app-admin/exports/admin/security.js";
import { ADMIN_EXTENSION_PERMISSIONS_SCHEMA } from "~/admin/adminExtensions/permissions.js";

export const AdminExtensionPermissions = createPermissionsAbstraction(
    ADMIN_EXTENSION_PERMISSIONS_SCHEMA
);

export namespace AdminExtensionPermissions {
    export type Interface = Permissions<typeof ADMIN_EXTENSION_PERMISSIONS_SCHEMA>;
}
