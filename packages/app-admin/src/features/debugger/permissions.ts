import { useAuthentication } from "~/presentation/security/hooks/useAuthentication.js";
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

export const DEBUG_PERMISSION_NAME = "dev-tools.debug";

/**
 * Whether the current identity may capture debug data.
 *
 * An exact match, deliberately: `*` and `dev-tools.*` do not grant it. Capture runs automatically
 * for whoever holds this, so a wildcard would leave it permanently on for every full-access
 * administrator, collecting record content on every request for people who never asked for it.
 *
 * Full access is therefore not enough. The entity has to be granted deliberately, and that act is
 * the opt-in.
 */
export const useCanCaptureDebugData = (): boolean => {
    const { identity } = useAuthentication();
    return Boolean(identity.getPermission(DEBUG_PERMISSION_NAME, true));
};
