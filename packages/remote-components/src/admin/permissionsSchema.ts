import { createPermissionSchema } from "@webiny/app-admin";

export const RC_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "remoteComponents",
    fullAccess: true,
    entities: [
        {
            id: "component",
            title: "Component",
            permission: "remoteComponents.component",
            scopes: ["full"],
            actions: [{ name: "rwd" }, { name: "ai", label: "Generate and refine with AI" }]
        }
    ]
});
