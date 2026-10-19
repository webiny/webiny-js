import { createPermissionsFeature } from "@webiny/api-core/features/security/permissions/index.js";
import { ADMIN_EXTENSION_PERMISSIONS_SCHEMA } from "~/api/adminExtensions/permissions.js";
import { AdminExtensionPermissions } from "./abstractions.js";

export const AdminExtensionPermissionsFeature = createPermissionsFeature(
    ADMIN_EXTENSION_PERMISSIONS_SCHEMA,
    AdminExtensionPermissions
);
