import { createPermissionSchema } from "~/features/security/permissions/index.js";

/**
 * The debugger lives under the `dev-tools` prefix, alongside the playgrounds.
 *
 * Note the consequence: `fullAccess: true` emits `dev-tools.*`, and permission matching is glob
 * based, so any role holding Dev Tools full access can capture debug data without `dev-tools.debug`
 * being granted explicitly.
 */
export const DEBUGGER_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "dev-tools",
    fullAccess: true,
    entities: [
        {
            id: "debug",
            title: "Debugger",
            permission: "dev-tools.debug",
            scopes: ["full"]
        }
    ]
});
