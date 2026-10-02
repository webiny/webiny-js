import type { ThemeManifest } from "@webiny/theme-common";
import type { CapturedNode, ResolvedColour } from "~/domain/artifacts.js";
import { colorToHex } from "./sectionShape.js";

/**
 * The colours a section actually uses, each with the theme token that expresses it.
 *
 * The pipeline already resolved this and threw it away. `collectColors` reads `backgroundColor`,
 * `color` and `borderTopColor` from every node and maps them against the theme — producing exactly the
 * mapping Plan needs to bind colour tokens — then merges all three into one flat set inside
 * `SectionShape`, which is never persisted. So Plan proposes `header.background -> color.surface.raised`
 * from the word "header", having never seen the section.
 *
 * Measured across the four sites: 14 of 34 rendered components use a background colour the section
 * does not have, while **1 dominant colour in 204 is invented**. The model is obeying a binding chosen
 * blind, not inventing.
 *
 * Three things this keeps that the flat set destroys:
 *
 * - **Role.** Which property the colour came from. Merging background, text and border into one set is
 *   what makes `color.surface.raised` and `color.text.primary` indistinguishable to a reader.
 * - **A null token.** A section colour with no theme token near it is a gap in theme extraction, and
 *   that family of finding has already proved real — every extracted theme's type scale stopped short
 *   of its site's display headings.
 * - **Area.** How much of the section the colour covers, which is what separates its background from
 *   an incidental swatch.
 */

/** Same role vocabulary as the properties it comes from, so the mapping stays checkable. */
const ROLE_BY_PROP = {
    backgroundColor: "background",
    color: "text",
    borderTopColor: "border"
} as const;

/**
 * How near a theme colour must be to count as expressing a measured one.
 *
 * Tight, because these are exact computed values on both sides rather than quantised samples: a theme
 * colour that is not this colour should come back as `null` and be reported, not rounded to the
 * nearest thing in the palette. That rounding is the defect being fixed, wearing a token.
 */
const NEAR_COLOUR = 24;

/** Transparent backgrounds are not a colour the section chose; they are the absence of one. */
const isTransparent = (value: string): boolean => /rgba\([^)]*,\s*0(\.0+)?\s*\)/i.test(value);

const toRgb = (hex: string): [number, number, number] => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
];

const distance = (a: [number, number, number], b: [number, number, number]): number =>
    Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

interface ThemeColour {
    path: string;
    cssVariable: string;
    hex: string;
}

/** The theme's colour slots with their resolved value and the variable that carries it. */
export const themeColourRoles = (manifest: ThemeManifest): ThemeColour[] => {
    const roles: ThemeColour[] = [];
    for (const slot of manifest.slots) {
        const value = slot.values?.light;
        if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value.trim())) {
            continue;
        }
        const cssVariable = (slot.cssVariables ?? [])[0];
        if (!cssVariable) {
            continue;
        }
        roles.push({ path: String(slot.path), cssVariable, hex: value.trim().toLowerCase() });
    }
    return roles;
};

/**
 * Which token families can express which role.
 *
 * Nearest-by-colour alone is not enough: a theme uses one `#ffffff` for several slots, so the first
 * match wins and white TEXT resolved to `color.surface.page`. The colour would render correctly and
 * the instruction would be nonsense in the theme's own vocabulary — and it would break the moment
 * `surface.page` changes for a surface reason.
 */
const FAMILY = {
    text: /(^|\.)text(\.|$)|foreground/i,
    background: /surface|background/i,
    border: /(^|\.)border(\.|$)/i
} as const;

const closest = (target: [number, number, number], candidates: ThemeColour[]) => {
    let best: ThemeColour | null = null;
    let bestDistance = Infinity;
    for (const candidate of candidates) {
        const d = distance(target, toRgb(candidate.hex));
        if (d < bestDistance) {
            bestDistance = d;
            best = candidate;
        }
    }
    return { best, bestDistance };
};

/**
 * The token that expresses this colour, preferring one whose family matches the role.
 *
 * A same-family token at the same colour is the right answer. Failing that, a token of another family
 * at the right colour is still better than a hardcoded hex — it survives a theme change, which a hex
 * does not — so it is used rather than discarded, and only a colour the theme cannot express at all
 * comes back null.
 */
const nearest = (
    hex: string,
    role: ResolvedColour["role"],
    roles: ThemeColour[]
): ThemeColour | null => {
    const target = toRgb(hex);
    const family = FAMILY[role];

    const preferred = closest(
        target,
        roles.filter(candidate => family.test(candidate.path))
    );
    if (preferred.best && preferred.bestDistance <= NEAR_COLOUR) {
        return preferred.best;
    }

    const any = closest(target, roles);
    return any.best && any.bestDistance <= NEAR_COLOUR ? any.best : null;
};

/** Bounded so a gradient-heavy section cannot inflate every member of a cluster. */
const MAX_COLOURS = 8;

/**
 * Each distinct colour the section uses, by role, largest area first.
 *
 * Area is counted only where the property actually paints: a background on a node whose background is
 * set, a text colour only on a node carrying text, a border colour only where there is a border width.
 * Counting every node's inherited `color` would make the body text colour the largest thing on the
 * page by area and say nothing about the section.
 */
export const resolveSectionColours = (
    node: CapturedNode,
    manifest: ThemeManifest | null
): ResolvedColour[] => {
    const roles = manifest ? themeColourRoles(manifest) : [];
    const areas = new Map<string, { role: ResolvedColour["role"]; hex: string; area: number }>();

    const add = (role: ResolvedColour["role"], hex: string, area: number): void => {
        const key = `${role}|${hex}`;
        const existing = areas.get(key);
        if (existing) {
            existing.area += area;
        } else {
            areas.set(key, { role, hex, area });
        }
    };

    const walk = (current: CapturedNode): void => {
        const box = current.box;
        const area = box && box.width > 0 && box.height > 0 ? box.width * box.height : 0;
        if (area > 0) {
            const styles = current.styles ?? {};

            const background = styles.backgroundColor;
            if (background && !isTransparent(background)) {
                const hex = colorToHex(background);
                if (hex) {
                    add(ROLE_BY_PROP.backgroundColor, hex, area);
                }
            }

            const hasText = (current.textRuns ?? (current.text ? [current.text] : []))
                .join("")
                .trim();
            if (hasText && styles.color) {
                const hex = colorToHex(styles.color);
                if (hex) {
                    add(ROLE_BY_PROP.color, hex, area);
                }
            }

            const borderWidth = parseFloat(styles.borderTopWidth ?? "0");
            if (borderWidth > 0 && styles.borderTopColor && !isTransparent(styles.borderTopColor)) {
                const hex = colorToHex(styles.borderTopColor);
                if (hex) {
                    add(ROLE_BY_PROP.borderTopColor, hex, area);
                }
            }
        }
        for (const child of current.children ?? []) {
            walk(child);
        }
    };
    walk(node);

    return [...areas.values()]
        .sort((a, b) => b.area - a.area)
        .slice(0, MAX_COLOURS)
        .map(entry => {
            const token = nearest(entry.hex, entry.role, roles);
            return {
                role: entry.role,
                hex: entry.hex,
                area: Math.round(entry.area),
                token: token
                    ? { path: token.path, cssVariable: token.cssVariable, hex: token.hex }
                    : null
            };
        });
};
