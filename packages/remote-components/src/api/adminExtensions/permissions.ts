import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

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
