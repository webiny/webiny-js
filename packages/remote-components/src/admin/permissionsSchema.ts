import { createPermissionSchema } from "@webiny/app-admin";

/*
 * Keep in sync with `src/api/domain/permissionsSchema.ts`. API and Admin each build the schema
 * with their own `createPermissionSchema`, as Website Builder and Background Tasks do.
 */
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
