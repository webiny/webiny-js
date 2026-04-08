import { createPermissionSchema } from "@webiny/app-admin";

export const FM_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "fm",
    fullAccess: true,
    entities: [
        {
            id: "file",
            title: "File",
            scopes: ["full", "own"],
            permission: "fm.file",
            actions: [{ name: "rwd" }]
        },
        {
            id: "settings",
            title: "Settings",
            scopes: ["full"],
            permission: "fm.settings"
        }
    ]
});
