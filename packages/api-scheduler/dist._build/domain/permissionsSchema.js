import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";
const SCHEDULER_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "scheduler",
    fullAccess: true,
    entities: [
        {
            id: "action",
            permission: "scheduler.action",
            scopes: [
                "full",
                "own"
            ]
        }
    ]
});
export { SCHEDULER_PERMISSIONS_SCHEMA };

//# sourceMappingURL=permissionsSchema.js.map