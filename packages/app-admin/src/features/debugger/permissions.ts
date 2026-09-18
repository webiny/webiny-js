import {
    createPermissionSchema,
    createPermissionsAbstraction,
    createPermissionsFeature,
    createUsePermissions
} from "~/permissions/index.js";

/**
 * Registered under its own name rather than joining the `dev-tools` group declared by the
 * playgrounds: `Security.Permissions` is keyed by name, so a second registration using the same name
 * would replace theirs and hide their entities from the role editor.
 *
 * The permission itself is `dev-tools.debug`, so it still sits under the Dev Tools prefix - and note
 * the consequence: `dev-tools.*` held by a Dev Tools full-access role matches it.
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

export const DebuggerPermissions = createPermissionsAbstraction(DEBUGGER_PERMISSIONS_SCHEMA);

export const DebuggerPermissionsFeature = createPermissionsFeature(
    DEBUGGER_PERMISSIONS_SCHEMA,
    DebuggerPermissions
);

export const useDebuggerPermissions = createUsePermissions(DebuggerPermissions);
