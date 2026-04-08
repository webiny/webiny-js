import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

export const FM_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "fm",
    fullAccess: true,
    entities: [
        {
            id: "file",
            permission: "fm.file",
            scopes: ["full", "own"],
            actions: [{ name: "rwd" }]
        },
        {
            id: "settings",
            permission: "fm.settings",
            scopes: ["full"]
        }
    ]
});
