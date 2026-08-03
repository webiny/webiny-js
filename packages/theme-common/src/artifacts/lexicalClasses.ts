import { CANONICAL_TYPOGRAPHY_ROLE_PATHS } from "~/canonical/typographyRoles.js";
import {
    toCssVariableName,
    toTypographyCssVariableName,
    TYPOGRAPHY_CSS_SEGMENTS
} from "~/naming/cssVariable.js";
import type { TokenPath } from "~/dtcg/types.js";
import type { TypographySubProperty } from "~/dtcg/guards.js";

/**
 * Structural rich-text styling — see the design brief, section 7.2.
 *
 * The spike this closes: Lexical's `EditorThemeClasses` maps each structural element to a **class name**,
 * not to a style object. There is no upstream hook for feeding it computed values, and its
 * `[key: string]: any` escape hatch does not change that. So the only way a heading in rich text can
 * follow the theme is: a stable class name per element, and a stylesheet that points those classes at the
 * theme's CSS variables.
 *
 * That split is a feature rather than a workaround. The class rules never change — only the variables
 * they read do — so this stylesheet is static and cacheable, emitted once, while the per-theme values keep
 * arriving through the existing CSS artifact. Nothing here has to be regenerated when a theme is
 * published.
 *
 * The mapping onto the eleven canonical typography roles is close to exact, which is the main reason this
 * is worth doing at all:
 *
 *   type.heading.1 … 6  →  heading.h1 … h6
 *   type.body           →  paragraph
 *   type.code           →  code
 *   type.lead           →  quote
 *
 * `type.bodySmall` and `type.caption` are deliberately unmapped: Lexical has no structural element that
 * means either, and inventing one would put a class in the document that no editor control can produce.
 */

/** Prefixed so a customer's own stylesheet cannot collide with these. */
export const LEXICAL_CLASS_PREFIX = "wby-rt";

/**
 * Class name per themed element, and the typography role it reads.
 *
 * `quote` maps to `type.lead` on the grounds that a pull quote and a lead paragraph are the same
 * typographic idea — larger than body, lighter in weight. It is the one judgement call in this table.
 */
export const LEXICAL_TYPOGRAPHY_CLASSES: ReadonlyArray<{
    /** Dot path into `EditorThemeClasses`. */
    themeKey: string;
    className: string;
    role: TokenPath;
}> = [
    { themeKey: "heading.h1", className: `${LEXICAL_CLASS_PREFIX}-h1`, role: "type.heading.1" },
    { themeKey: "heading.h2", className: `${LEXICAL_CLASS_PREFIX}-h2`, role: "type.heading.2" },
    { themeKey: "heading.h3", className: `${LEXICAL_CLASS_PREFIX}-h3`, role: "type.heading.3" },
    { themeKey: "heading.h4", className: `${LEXICAL_CLASS_PREFIX}-h4`, role: "type.heading.4" },
    { themeKey: "heading.h5", className: `${LEXICAL_CLASS_PREFIX}-h5`, role: "type.heading.5" },
    { themeKey: "heading.h6", className: `${LEXICAL_CLASS_PREFIX}-h6`, role: "type.heading.6" },
    { themeKey: "paragraph", className: `${LEXICAL_CLASS_PREFIX}-p`, role: "type.body" },
    { themeKey: "code", className: `${LEXICAL_CLASS_PREFIX}-code`, role: "type.code" },
    { themeKey: "quote", className: `${LEXICAL_CLASS_PREFIX}-quote`, role: "type.lead" }
];

/** Roles with no structural equivalent in Lexical, recorded so the omission is deliberate and checkable. */
export const UNMAPPED_TYPOGRAPHY_ROLES: readonly TokenPath[] = ["type.bodySmall", "type.caption"];

/** The CSS property each typography sub-property drives. */
const CSS_PROPERTY: Readonly<Record<TypographySubProperty, string>> = {
    fontFamily: "font-family",
    fontSize: "font-size",
    fontWeight: "font-weight",
    lineHeight: "line-height",
    letterSpacing: "letter-spacing"
};

const SUB_PROPERTIES = Object.keys(TYPOGRAPHY_CSS_SEGMENTS) as TypographySubProperty[];

/**
 * The class-name map to hand to Lexical.
 *
 * Nested keys (`heading.h1`) are expanded, because that is the shape `EditorThemeClasses` declares.
 */
export const createLexicalThemeClasses = (): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const entry of LEXICAL_TYPOGRAPHY_CLASSES) {
        const segments = entry.themeKey.split(".");

        if (segments.length === 1) {
            result[segments[0]] = entry.className;
            continue;
        }

        const [group, key] = segments;
        const existing = (result[group] ?? {}) as Record<string, string>;
        existing[key] = entry.className;
        result[group] = existing;
    }

    return result;
};

export interface LexicalCssOptions {
    /**
     * Scope selector, so the rules can be confined to the editor surface or a rendered page.
     *
     * Unscoped by default: on a site these classes only appear on rich-text output, so a global rule is
     * both correct and cheaper than nesting every selector.
     */
    scope?: string;
}

/**
 * The static stylesheet.
 *
 * Emitted from the same table as the class map, so the two cannot disagree — a class that exists in one
 * and not the other would silently render unthemed.
 */
export const generateLexicalCss = ({ scope }: LexicalCssOptions = {}): string => {
    const prefix = scope ? `${scope} ` : "";

    const blocks = LEXICAL_TYPOGRAPHY_CLASSES.map(entry => {
        const declarations = SUB_PROPERTIES.map(sub => {
            const variable = toTypographyCssVariableName(entry.role, sub);
            return `    ${CSS_PROPERTY[sub]}: var(${variable});`;
        }).join("\n");

        return `${prefix}.${entry.className} {\n${declarations}\n}`;
    });

    // A blockquote also takes the theme's border colour, which is the only non-typographic rule here and
    // the one thing a lead-paragraph role cannot express.
    const quote = LEXICAL_TYPOGRAPHY_CLASSES.find(entry => entry.themeKey === "quote");
    if (quote) {
        blocks.push(
            `${prefix}.${quote.className} {\n` +
                `    border-inline-start: 3px solid var(${toCssVariableName("color.border.subtle")});\n` +
                `}`
        );
    }

    return [
        "/* Webiny rich-text structural styles. Generated — do not edit.",
        "   These class rules are static; the values they read come from the active theme's CSS artifact. */",
        ...blocks
    ].join("\n\n");
};

/**
 * Every role either maps to a Lexical element or is listed as unmapped.
 *
 * Exported so a test can assert it, because the failure mode of a forgotten role is invisible: rich text
 * simply renders unthemed for that one element.
 */
export const getUnaccountedTypographyRoles = (): TokenPath[] => {
    const mapped = new Set(LEXICAL_TYPOGRAPHY_CLASSES.map(entry => entry.role));
    const excluded = new Set(UNMAPPED_TYPOGRAPHY_ROLES);

    return CANONICAL_TYPOGRAPHY_ROLE_PATHS.filter(path => !mapped.has(path) && !excluded.has(path));
};
