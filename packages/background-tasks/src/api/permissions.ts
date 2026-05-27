import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

export const BACKGROUND_TASK_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "backgroundTasks",
    fullAccess: true,
    entities: [
        {
            id: "task",
            permission: "backgroundTasks.task",
            scopes: ["full"],
            actions: [{ name: "rwd" }]
        }
    ]
});
