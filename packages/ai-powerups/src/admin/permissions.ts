import { createPermissionSchema } from "@webiny/app-admin";

/*
 * Mirrors the API schema in `~/api/permissions.ts`. The two have to stay in step, the same way the
 * webhooks and file manager schemas do.
 */
export const AI_POWER_UPS_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "aiPowerUps",
    fullAccess: true,
    entities: [
        {
            id: "settings",
            title: "Settings",
            permission: "aiPowerUps.settings",
            scopes: ["full"]
        }
    ]
});
