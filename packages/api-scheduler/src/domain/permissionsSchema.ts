import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

export const SCHEDULER_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "scheduler",
    fullAccess: true,
    entities: [
        {
            id: "action",
            permission: "scheduler.action",
            scopes: ["full", "own"]
        }
    ]
});
