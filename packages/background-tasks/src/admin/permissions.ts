import { createPermissionSchema } from "@webiny/app-admin";

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
