import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

export const RC_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "remoteComponents",
    fullAccess: true,
    entities: [
        {
            id: "component",
            permission: "remoteComponents.component",
            scopes: ["full"],
            actions: [{ name: "rwd" }, { name: "ai", label: "Generate and refine with AI" }]
        }
    ]
});
