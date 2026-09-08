import { createPermissionSchema } from "@webiny/app-admin";

export const FRONTEND_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "frontend",
    fullAccess: true,
    entities: [
        {
            id: "settings",
            title: "Settings",
            scopes: ["full"],
            permission: "frontend.settings"
        }
    ]
});
