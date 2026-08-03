import type { TokenPath } from "~/dtcg/types.js";

/**
 * A core-owned composite typography token. Each role holds family, size, weight, line height and
 * letter spacing, and every sub-property may alias a primitive.
 */
export interface CanonicalTypographyRole {
    path: TokenPath;
    label: string;
    /** Editor grouping key — headings are collapsed together in the UI. */
    group: "text" | "heading";
}

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

/** The 11 canonical typography roles. */
export const CANONICAL_TYPOGRAPHY_ROLES: readonly CanonicalTypographyRole[] = [
    { path: "type.body", label: "Body", group: "text" },
    { path: "type.bodySmall", label: "Body small", group: "text" },
    { path: "type.caption", label: "Caption", group: "text" },
    { path: "type.lead", label: "Lead", group: "text" },
    { path: "type.code", label: "Code", group: "text" },
    ...HEADING_LEVELS.map(level => ({
        path: `type.heading.${level}`,
        label: `Heading ${level}`,
        group: "heading" as const
    }))
];

export const CANONICAL_TYPOGRAPHY_ROLE_PATHS: readonly TokenPath[] = CANONICAL_TYPOGRAPHY_ROLES.map(
    role => role.path
);
