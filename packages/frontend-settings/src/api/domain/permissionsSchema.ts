import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

export const FRONTEND_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "frontend",
    fullAccess: true,
    entities: [
        {
            id: "settings",
            permission: "frontend.settings",
            scopes: ["full"]
        }
    ]
});
