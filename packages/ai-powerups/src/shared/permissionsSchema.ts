/**
 * AI Power-Ups permissions, shared by the API and the Admin app.
 *
 * Defined as a plain object, without either app's `createPermissionSchema`, so neither side
 * pulls in the other's code. The literal types are kept by hand: the entity `id` drives the
 * typed `canAccess("settings")`, and `scopes` must be a mutable array for the Admin app's types.
 *
 * Only the settings are gated. They hold the AI provider API keys, so viewing the masked keys and
 * changing the settings needs `aiPowerups.settings`. Using the AI features needs a logged-in user.
 */
export const AI_POWERUPS_PERMISSIONS_SCHEMA = {
    prefix: "aiPowerups",
    fullAccess: true,
    entities: [
        {
            id: "settings" as const,
            title: "Settings",
            permission: "aiPowerups.settings",
            scopes: ["full" as const]
        }
    ]
};
