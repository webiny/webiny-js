import { createPermissionsFeature } from "@webiny/app-admin/exports/admin/security.js";
import { ADMIN_EXTENSION_PERMISSIONS_SCHEMA } from "~/admin/adminExtensions/permissions.js";
import { AdminExtensionPermissions } from "./abstractions.js";

export const AdminExtensionPermissionsFeature = createPermissionsFeature(
    ADMIN_EXTENSION_PERMISSIONS_SCHEMA,
    AdminExtensionPermissions
);
