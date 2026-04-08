import { createPermissionSchema } from "@webiny/app-admin";

export const CMS_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "cms",
    fullAccess: true,
    entities: [
        {
            id: "contentModelGroup",
            title: "Content Model Groups",
            permission: "cms.contentModelGroup",
            scopes: ["full", "own"],
            actions: [{ name: "rwd" }]
        },
        {
            id: "contentModel",
            title: "Content Models",
            permission: "cms.contentModel",
            scopes: ["full", "own"],
            actions: [{ name: "rwd" }]
        },
        {
            id: "contentEntry",
            title: "Content Entries",
            permission: "cms.contentEntry",
            scopes: ["full", "own"],
            actions: [{ name: "rwd" }, { name: "pw" }]
        }
    ]
});
