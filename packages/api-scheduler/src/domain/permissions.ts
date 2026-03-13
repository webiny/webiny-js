import { createPermissions } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";

const schema = {
    prefix: "scheduler",
    fullAccess: true,
    entities: [
        {
            id: "action",
            permission: "scheduler.*",
            scopes: ["full", "own"]
            // actions: [{ name: "rwd" }]
        }
    ]
} as const;

type SchedulerSchema = typeof schema;

export const SchedulerPermissions = createPermissions(schema);

export namespace SchedulerPermissions {
    export type Interface = Permissions<SchedulerSchema>;
}
