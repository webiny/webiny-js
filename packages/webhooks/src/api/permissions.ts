import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

export const WEBHOOK_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "webhooks",
    fullAccess: true,
    entities: [
        {
            id: "webhook",
            permission: "webhooks.webhook",
            scopes: ["full"],
            actions: [{ name: "rwd" }]
        }
    ]
});
