import { createPermissionSchema } from "~/features/security/permissions/index.js";

/**
 * The debugger lives under the `dev-tools` prefix, alongside the playgrounds.
 *
 * `fullAccess: true` emits `dev-tools.*`, which glob matching would let through, but capture is gated
 * on an exact match of `dev-tools.debug` (see `canCaptureDebugData`). Dev Tools full access alone
 * does not turn capture on.
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
