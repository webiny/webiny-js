import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

export const WB_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "wb",
    fullAccess: true,
    entities: [
        {
            id: "page",
            permission: "wb.page",
            scopes: ["full", "own"],
            actions: [{ name: "rwd" }, { name: "pw" }]
        },
        {
            id: "redirect",
            permission: "wb.redirect",
            scopes: ["full", "own"],
            actions: [{ name: "rwd" }]
        },
        {
            id: "settings",
            permission: "wb.settings",
            scopes: ["full"]
        },
        {
            id: "integrations",
            permission: "wb.integrations",
            scopes: ["full"]
        }
    ]
});
