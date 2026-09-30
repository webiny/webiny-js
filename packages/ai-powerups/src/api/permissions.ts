import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

/*
 * One entity, with no actions: a role either manages the AI Power-Ups settings or it doesn't. The
 * AI features themselves stay open to everyone, since they read the settings on the caller's
 * behalf; this only decides who may change them.
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
