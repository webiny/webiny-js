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
    /** Usage guidance, seeded onto `$description` and read by the generation model. See C5. */
    description: string;
}

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

/** How prominent each heading level is, for its usage guidance. */
const HEADING_ROLE: Readonly<Record<number, string>> = {
    1: "The main page title — one per page",
    2: "Major section headings",
    3: "Subsection headings",
    4: "Fourth-level headings",
    5: "Fifth-level headings",
    6: "Sixth-level headings, the least prominent"
};

/** The 11 canonical typography roles. */
export const CANONICAL_TYPOGRAPHY_ROLES: readonly CanonicalTypographyRole[] = [
    {
        path: "type.body",
        label: "Body",
        group: "text",
        description: "Default body copy and paragraphs"
    },
    {
        path: "type.bodySmall",
        label: "Body small",
        group: "text",
        description: "Secondary body text a step smaller than body"
    },
    {
        path: "type.caption",
        label: "Caption",
        group: "text",
        description: "Captions, labels and fine print"
    },
    {
        path: "type.lead",
        label: "Lead",
        group: "text",
        description: "Introductory or standfirst text, larger than body"
    },
    {
        path: "type.code",
        label: "Code",
        group: "text",
        description: "Inline code and code blocks, in a monospace family"
    },
    ...HEADING_LEVELS.map(level => ({
        path: `type.heading.${level}`,
        label: `Heading ${level}`,
        group: "heading" as const,
        description: HEADING_ROLE[level]
    }))
];

export const CANONICAL_TYPOGRAPHY_ROLE_PATHS: readonly TokenPath[] = CANONICAL_TYPOGRAPHY_ROLES.map(
    role => role.path
);
