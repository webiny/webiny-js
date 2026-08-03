import { createPermissionSchema } from "@webiny/api-core/exports/api/security.js";

/**
 * One permission gates the whole Theme app — see the design brief, section 6.1.
 *
 * `rwd` covers create, edit and delete; `pw` covers publish and unpublish, and activation is gated
 * on publish too, since activating is the act that makes a published version live.
 *
 * There is no `own` scope. Themes are tenant-level configuration, not per-author content: a theme
 * one editor created is not meaningfully "theirs", and own-scoping would leave a tenant unable to
 * see the theme its own site is running.
 */
export const THEME_PERMISSIONS_SCHEMA = createPermissionSchema({
    prefix: "theme",
    fullAccess: true,
    entities: [
        {
            id: "theme",
            permission: "theme.theme",
            scopes: ["full"],
            actions: [{ name: "rwd" }, { name: "pw" }]
        }
    ]
});
