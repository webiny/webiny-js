import { createPermissionSchema } from "@webiny/app-admin/exports/admin/security.js";

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
