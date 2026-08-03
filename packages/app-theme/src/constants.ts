import { createPermissionSchema } from "@webiny/app-admin";

/**
 * Mirrors `THEME_PERMISSIONS_SCHEMA` in `@webiny/api-theme`. The two are declared separately
 * because each side builds from its own factory, but the prefix, entity id and action names MUST
 * stay identical — the permissions the Admin UI emits are evaluated by the API schema.
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

export const ThemeStatus = {
    Draft: "draft",
    Published: "published",
    Unpublished: "unpublished"
} as const;

export type ThemeStatusValue = (typeof ThemeStatus)[keyof typeof ThemeStatus];

/** Token groups shown in the editor's left rail, in order. */
export const EDITOR_GROUPS = [
    { id: "colors", label: "Colours", icon: "palette" },
    { id: "typography", label: "Typography", icon: "text_fields" },
    { id: "spacing", label: "Spacing", icon: "width_normal" },
    { id: "radius", label: "Radius", icon: "rounded_corner" },
    { id: "shadows", label: "Shadows", icon: "layers" },
    { id: "policy", label: "Policy", icon: "shield" }
] as const;

export type EditorGroupId = (typeof EDITOR_GROUPS)[number]["id"];
