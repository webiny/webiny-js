import { createHasPermission } from "@webiny/app-admin/exports/admin/security.js";
import { AdminExtensionPermissions } from "~/admin/adminExtensions/features/permissions/abstractions.js";
import { ADMIN_EXTENSION_PERMISSIONS_SCHEMA } from "~/admin/adminExtensions/permissions.js";

export const HasPermission =
    createHasPermission<typeof ADMIN_EXTENSION_PERMISSIONS_SCHEMA>(AdminExtensionPermissions);
