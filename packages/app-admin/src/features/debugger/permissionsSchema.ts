import { createPermissionSchema } from "~/permissions/index.js";

/**
 * A prefix of its own rather than an entity under `dev-tools`.
 *
 * `dev-tools` is already claimed by the GraphQL and SDK playgrounds, both with `fullAccess: true`,
 * which emits `dev-tools.*`. A `dev-tools.debug` permission would therefore be granted implicitly to
 * every role that holds Dev Tools full access - commonly granted just for playground access.
 */
export const DEBUGGER_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "debugger",
    fullAccess: true,
    entities: [
        {
            id: "capture",
            title: "Debug capture",
            permission: "debugger.capture",
            scopes: ["full"]
        }
    ]
});
