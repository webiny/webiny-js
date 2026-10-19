import { createPermissionsAbstraction } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";
import { ADMIN_EXTENSION_PERMISSIONS_SCHEMA } from "~/api/adminExtensions/permissions.js";

export const AdminExtensionPermissions = createPermissionsAbstraction(
    ADMIN_EXTENSION_PERMISSIONS_SCHEMA
);

export namespace AdminExtensionPermissions {
    export type Interface = Permissions<typeof ADMIN_EXTENSION_PERMISSIONS_SCHEMA>;
}
