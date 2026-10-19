import { createPermissionSchema } from "@webiny/app-admin/exports/admin/security.js";

// Mirrors the API schema in `~/api/adminExtensions/permissions.ts`.
export const ADMIN_EXTENSION_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "adminExtensions",
    fullAccess: true,
    entities: [
        {
            id: "adminExtension",
            permission: "adminExtensions.adminExtension",
            scopes: ["full"],
            actions: [{ name: "rwd" }]
        }
    ]
});
