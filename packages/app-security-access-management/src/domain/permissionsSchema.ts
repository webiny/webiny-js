import { createPermissionSchema } from "@webiny/app-admin";

export const SECURITY_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "security",
    fullAccess: true,
    entities: [
        {
            id: "apiKey",
            title: "API Keys",
            permission: "security.apiKey",
            scopes: ["full"]
        },
        {
            id: "group",
            title: "Roles",
            permission: "security.group",
            scopes: ["full"]
        },
        {
            id: "team",
            title: "Teams",
            permission: "security.team",
            scopes: ["full"]
        }
    ]
});
