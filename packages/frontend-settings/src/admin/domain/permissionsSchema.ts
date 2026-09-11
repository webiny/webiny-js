import { createPermissionSchema } from "@webiny/app-admin";

export const FRONTEND_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "dev-tools",
    fullAccess: true,
    entities: [
        {
            id: "frontend-settings",
            title: "Frontend Settings",
            scopes: ["full"],
            permission: "dev-tools.frontend-settings.*"
        }
    ]
});
