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
 * Lexical's `EditorThemeClasses` maps each structural element to a **class name**, not a style object, so
 * a heading in rich text can only follow the theme via a stable class name plus a stylesheet that points
 * that class at the theme's CSS variables.
 *
 * The decisive point for backwards compatibility: Website Builder **already** applies these class names.
 * Its editor's `EditorThemeClasses` uses the `wb-lx-` prefix, and the resulting HTML — `<h1 class=
 * "wb-lx-h1">`, `<p class="wb-lx-paragraph">` — is baked into every saved page and rendered verbatim. So
 * this table does NOT invent names; it aligns to the ones WB has always emitted. A theme therefore styles
 * every existing page as well as new ones, with no content migration, and an instance with no active
 * theme is untouched (the base `lexical.css` still governs, and the `var(--wby-*)` below simply resolve
 * to nothing).
 *
 * The mapping onto the eleven canonical typography roles is close to exact:
 *
 *   type.heading.1 … 6  →  wb-lx-h1 … h6
 *   type.body           →  wb-lx-paragraph
 *   type.code           →  wb-lx-code
 *   type.lead           →  wb-lx-quote
 *
 * `type.bodySmall` and `type.caption` are deliberately unmapped: WB has no structural class for either.
 * `wb-lx-paragraph` is a single class, NOT WB's numbered `wb-paragraph-N` typography presets — those are a
 * separate mechanism and their reconciliation with the semantic roles is out of scope here.
 */

/** The prefix Website Builder's editor uses for structural rich-text classes. We align to it, not invent. */
export const LEXICAL_CLASS_PREFIX = "wb-lx";

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
    { themeKey: "paragraph", className: `${LEXICAL_CLASS_PREFIX}-paragraph`, role: "type.body" },
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
 * The rich-text stylesheet, folded into the theme's CSS artifact by `generateCssArtifact`.
 *
 * It emits only typography properties on the `wb-lx-*` structural classes, each reading a `var(--wby-*)`
 * defined in the same artifact — so it is additive over the base `lexical.css` (whose heading/paragraph
 * rules are empty) and, loaded after it, wins on the properties it sets. When no theme is active the
 * artifact is not loaded at all, so the base stylesheet governs unchanged.
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
