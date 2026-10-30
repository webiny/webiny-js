import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

/*
 * Keep in sync with `src/admin/permissionsSchema.ts`. API and Admin each build the schema
 * with their own `createPermissionSchema`, as Website Builder and Background Tasks do.
 */
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
