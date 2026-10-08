import type { ThemeManifest } from "@webiny/theme-common";
import type { CapturedNode, TypeScaleEntry } from "~/domain/artifacts.js";

/**
 * The type scale a section actually used, expressed in the theme's vocabulary where it has one.
 *
 * Measured on both sides, a generated component's type is systematically small: max font size has a
 * median ratio of 0.77 against its source section and is smaller on 21 of 31 components, with heading
 * errors reaching -44px. The mechanism is sharper than a bias — 15 of 31 renders put their largest
 * type between 31px and 34px, 13 of them at exactly 33px, behind source headings from 31px to 60px.
 * The model is not scaling the section's type. It is writing a house heading of about 2rem whatever
 * the section did, because nothing ever told it what the section did.
 *
 * `fontSize` and `lineHeight` are captured on every node and read by nothing — the same shape as the
 * image values: measured, carried one stage, dropped.
 *
 * Per section rather than per prop, deliberately. Attaching a size to each text prop would need props
 * mapped to source nodes, which is the alignment problem that put 52 props across four sites in the
 * wrong slot and took a rewrite to contain. A scale says which sizes exist and how common each is;
 * the model already knows which of its own props is the heading, and cannot misattribute a scale.
 */

/** Sizes within this of each other are the same step — a page rounds 19.5px and 20px to one intent. */
const SAME_SIZE_PX = 1;

/**
 * How near a theme role must be to count as the way to express a measured size.
 *
 * Generous rather than strict: the point is to reach for the theme first, and a heading two percent
 * off is still the heading. What this must NOT do is match anything to the nearest role regardless of
 * distance — a 60px source heading silently bound to a 33px `type.h1` is exactly the failure being
 * fixed, wearing a token.
 */
const NEAR_TOKEN = (measured: number): number => Math.max(1.5, measured * 0.1);

const px = (value: unknown): number | null => {
    if (typeof value === "number") {
        return value > 0 ? value : null;
    }
    if (typeof value !== "string") {
        return null;
    }
    const match = /^(-?[\d.]+)(px|rem|em)?$/.exec(value.trim());
    if (!match) {
        return null;
    }
    const n = parseFloat(match[1]);
    if (!isFinite(n) || n <= 0) {
        return null;
    }
    // rem/em against the 16px root the capture ran at; a unitless number is already px.
    return match[2] === "rem" || match[2] === "em" ? n * 16 : n;
};

export interface ThemeTypeRole {
    path: string;
    cssVariable: string;
    fontSize: number;
}

/**
 * The theme's typography roles with their resolved sizes.
 *
 * A role is a composite — family, size, weight, line height, letter spacing — and contributes several
 * CSS variables. The one that carries the size is the one a component needs to reference, so it is
 * preferred by name and the first variable is the fallback for a theme that names them differently.
 */
export const themeTypeRoles = (manifest: ThemeManifest): ThemeTypeRole[] => {
    const roles: ThemeTypeRole[] = [];
    for (const slot of manifest.slots) {
        const value = slot.values?.light as { fontSize?: unknown } | undefined;
        const size = value && typeof value === "object" ? px(value.fontSize) : null;
        if (size === null) {
            continue;
        }
        /*
         * The variable carrying the SIZE, not the first one the slot contributes.
         *
         * A typography role emits one variable per sub-property, family first — this theme names them
         * `--wby-type-heading-1-family`, `-size`, `-line-height`, `-weight`. Matching only
         * `font-size` found none of them and fell back to `variables[0]`, so the first run told the
         * model to set a font size to `var(--wby-type-heading-6-family)`. A fallback that picks the
         * wrong variable is worse than no token, because the CSS it produces looks deliberate.
         */
        const variables = slot.cssVariables ?? [];
        const sized = variables.find(name => /(^|-)(font-?size|size)$/i.test(name));
        if (!sized) {
            continue;
        }
        roles.push({ path: String(slot.path), cssVariable: sized, fontSize: size });
    }
    return roles;
};

const isHeadingRole = (path: string): boolean => /heading|display/i.test(path);

/**
 * Breaks a tie between a heading role and a body role at the same distance from a step's size.
 *
 * `nearestRole` matches by size alone and keeps the first role at the smallest distance, and the
 * manifest lists headings first. The extracted themes reuse sizes across roles — thevibe's body and
 * `heading.3` are both 22px, `lead` and `heading.4` both 20px — so 151 of 266 type steps across five
 * sites were decided by that order, and the heading won every one: a paragraph was told to use
 * `--wby-type-heading-3-size`. A tie now goes to a heading role only when every element at the step is
 * a heading. A step with a clear nearest role is left as it was. Where a plan predates `headings`, the
 * step is taken as body text: it is a tie-break, so it cannot move a step that was not tied.
 */
export const roleAwareTypeToken = (
    step: Pick<TypeScaleEntry, "fontSize" | "elements" | "headings" | "token">,
    roles: ThemeTypeRole[]
): TypeScaleEntry["token"] => {
    const token = step.token;
    const chosen = token ? roles.find(role => role.path === token.path) : undefined;
    if (!token || !chosen) {
        return token;
    }
    const wantHeading =
        step.headings !== undefined && step.elements > 0 && step.headings === step.elements;
    if (isHeadingRole(chosen.path) === wantHeading) {
        return token;
    }
    const distance = (role: ThemeTypeRole) =>
        Math.round(Math.abs(role.fontSize - step.fontSize) * 10) / 10;
    const rival = roles.find(
        role => isHeadingRole(role.path) === wantHeading && distance(role) === distance(chosen)
    );
    return rival
        ? {
              path: rival.path,
              cssVariable: rival.cssVariable,
              fontSize: Math.round(rival.fontSize * 10) / 10
          }
        : token;
};

const nearestRole = (size: number, roles: ThemeTypeRole[]): ThemeTypeRole | null => {
    let best: ThemeTypeRole | null = null;
    let bestDistance = Infinity;
    for (const role of roles) {
        const distance = Math.abs(role.fontSize - size);
        if (distance < bestDistance) {
            bestDistance = distance;
            best = role;
        }
    }
    return best && bestDistance <= NEAR_TOKEN(size) ? best : null;
};

/**
 * Every distinct type size the section's text-bearing elements use, largest first.
 *
 * Text-bearing means a node with direct non-empty text and a non-zero box — the same definition the
 * render-side measurement uses, so the two are comparable. A wrapper's inherited size is not a
 * decision the page made about type.
 */
interface ThemeFont {
    family: string;
    cssVariable: string;
}

const firstFamily = (stack: unknown): string | null => {
    const value = Array.isArray(stack)
        ? stack[0]
        : typeof stack === "string"
          ? stack.split(",")[0]
          : null;
    if (typeof value !== "string") {
        return null;
    }
    const family = value
        .trim()
        .replace(/^["']|["']$/g, "")
        .trim()
        .toLowerCase();
    return family || null;
};

/**
 * The theme's font families, each with the variable that carries it: a typography style's own
 * font-family variable, and every standalone font-family token.
 */
export const themeFonts = (manifest: ThemeManifest): ThemeFont[] => {
    const fonts: ThemeFont[] = [];
    for (const slot of manifest.slots) {
        const value = slot.values?.light as unknown;
        const variables = slot.cssVariables ?? [];
        if (value && typeof value === "object" && !Array.isArray(value)) {
            const family = firstFamily((value as { fontFamily?: unknown }).fontFamily);
            const variable = variables.find(name => /font-?family$/i.test(name));
            if (family && variable) {
                fonts.push({ family, cssVariable: variable });
            }
        } else if (variables.length === 1 && /font-?family/i.test(variables[0])) {
            const family = firstFamily(value);
            if (family) {
                fonts.push({ family, cssVariable: variables[0] });
            }
        }
    }
    return fonts;
};

const TRANSFORMS = new Set(["uppercase", "lowercase", "capitalize"]);
/**
 * Icon fonts draw a glyph from a ligature name — "chevron_left", "event" — so their text is not text.
 * Measured on Freehill's contact form: three of its thirteen steps were Material Icons names.
 */
const ICON_FONT = /material[\s-]*(icons|symbols)|font\s*awesome|^fa$|icomoon|glyphicons|icons?$/i;
/** Enough for a dense form; past this the steps covering fewest elements are left out. */
const MAX_STEPS = 10;
const EXAMPLE_CAP = 40;

interface StepStyle {
    family: string | null;
    stack: string | null;
    weight: number | null;
    transform: TypeScaleEntry["textTransform"] | null;
    italic: boolean;
}

const styleOf = (styles: Record<string, string> | undefined): StepStyle => {
    const weight = parseInt(styles?.fontWeight ?? "", 10);
    const transform = styles?.textTransform;
    return {
        family: firstFamily(styles?.fontFamily),
        stack: styles?.fontFamily?.trim() || null,
        weight: isFinite(weight) ? weight : null,
        transform:
            transform && TRANSFORMS.has(transform) ? (transform as StepStyle["transform"]) : null,
        italic: styles?.fontStyle === "italic" || styles?.fontStyle === "oblique"
    };
};

const sameStyle = (a: StepStyle, b: StepStyle): boolean =>
    a.family === b.family &&
    a.weight === b.weight &&
    a.transform === b.transform &&
    a.italic === b.italic;

/**
 * The section's type steps, largest first: each distinct size, and within a size each distinct
 * style — family, weight, case, slant.
 *
 * Sizes alone left out what makes text look like the page's: Freehill's hero headline is uppercase
 * and light on the page, set in lowercase in the HTML, and came out mixed-case in one run and capitals
 * in another, depending on what the model read off the picture; display families were swapped for
 * the default. So each step carries its style, and the theme variable for its family when there is
 * one. A 14px uppercase label and 14px body text are now two steps, as they look.
 */
export const sectionTypeScale = (
    node: CapturedNode,
    manifest: ThemeManifest | null
): TypeScaleEntry[] => {
    const roles = manifest ? themeTypeRoles(manifest) : [];
    const fonts = manifest ? themeFonts(manifest) : [];
    const seen: {
        fontSize: number;
        lineHeight: number | null;
        elements: number;
        headings: number;
        style: StepStyle;
        letterSpacing: number | null;
        example: string;
    }[] = [];

    const walk = (current: CapturedNode, inHeading = false): void => {
        const heading = inHeading || /^h[1-6]$/i.test(current.tag);
        const runs = current.textRuns ?? (current.text ? [current.text] : []);
        const text = runs.join(" ").replace(/\s+/g, " ").trim();
        const box = current.box;
        const size = px(current.styles?.fontSize);
        const iconFont = ICON_FONT.test(firstFamily(current.styles?.fontFamily) ?? "");
        if (text && !iconFont && box && box.width > 0 && box.height > 0 && size !== null) {
            const lineHeight = px(current.styles?.lineHeight);
            const style = styleOf(current.styles);
            const existing = seen.find(
                entry =>
                    Math.abs(entry.fontSize - size) <= SAME_SIZE_PX && sameStyle(entry.style, style)
            );
            if (existing) {
                existing.elements++;
                existing.headings += heading ? 1 : 0;
                if (existing.lineHeight === null) {
                    existing.lineHeight = lineHeight;
                }
                if (existing.letterSpacing === null) {
                    existing.letterSpacing = px(current.styles?.letterSpacing);
                }
            } else {
                seen.push({
                    fontSize: size,
                    lineHeight,
                    elements: 1,
                    headings: heading ? 1 : 0,
                    style,
                    letterSpacing: px(current.styles?.letterSpacing),
                    example: text.length > EXAMPLE_CAP ? `${text.slice(0, EXAMPLE_CAP - 1)}…` : text
                });
            }
        }
        for (const child of current.children ?? []) {
            walk(child, heading);
        }
    };
    walk(node);

    return [...seen]
        .sort((a, b) => b.elements - a.elements)
        .slice(0, MAX_STEPS)
        .sort((a, b) => b.fontSize - a.fontSize)
        .map(entry => {
            const nearest = nearestRole(entry.fontSize, roles);
            const token = roleAwareTypeToken(
                {
                    fontSize: entry.fontSize,
                    elements: entry.elements,
                    headings: entry.headings,
                    token: nearest
                        ? {
                              path: nearest.path,
                              cssVariable: nearest.cssVariable,
                              fontSize: Math.round(nearest.fontSize * 10) / 10
                          }
                        : null
                },
                roles
            );
            const font = entry.style.family
                ? fonts.find(candidate => candidate.family === entry.style.family)
                : undefined;
            return {
                fontSize: Math.round(entry.fontSize * 10) / 10,
                lineHeight:
                    entry.lineHeight === null ? null : Math.round(entry.lineHeight * 10) / 10,
                elements: entry.elements,
                headings: entry.headings,
                token,
                ...(entry.style.stack ? { fontFamily: entry.style.stack } : {}),
                ...(font ? { fontFamilyToken: { cssVariable: font.cssVariable } } : {}),
                ...(entry.style.weight !== null ? { fontWeight: entry.style.weight } : {}),
                ...(entry.style.transform ? { textTransform: entry.style.transform } : {}),
                ...(entry.letterSpacing
                    ? { letterSpacing: Math.round(entry.letterSpacing * 100) / 100 }
                    : {}),
                ...(entry.style.italic ? { italic: true } : {}),
                example: entry.example
            };
        });
};
