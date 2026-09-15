import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

export const FRONTEND_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "dev-tools",
    fullAccess: true,
    entities: [
        {
            id: "frontend-settings",
            permission: "dev-tools.frontend-settings.*",
            scopes: ["full"]
        }
    ]
});
