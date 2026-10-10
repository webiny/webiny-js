import type { ThemeManifest } from "@webiny/theme-common";
import type { CapturedNode, ResolvedColour } from "~/domain/artifacts.js";
import { colorToHex } from "./sectionShape.js";
import { isStatusColour } from "../generate/colourFamilies.js";

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

/**
 * A background colour under a background image is a fallback the page never shows.
 *
 * Park city's hero is a dark blue photograph with a small terracotta button. Its root element sets
 * `background-color: #a65f46` behind that photo, and with the image uncaptured the fallback was the
 * largest painted colour in the section — 696,960px of 712,000. Plan bound the section background to
 * it, Generate was told to use it, and a blue hero rendered as a flat terracotta block.
 *
 * The capture was right and the conclusion was wrong, which is the more dangerous combination: the
 * colour is genuinely set, so nothing looked like an error. Reporting it is worse than reporting
 * nothing, because `resolveSectionColours` feeds an instruction rather than a guess.
 *
 * Except where the image is a tint rather than a cover. Park city's Property Description draws faint
 * white lines at 10-20% opacity over the page's light backdrop, and 2424 Tulane's highlights draw
 * circles over their own pale green: treated as covers, the colour that actually shows was dropped,
 * the largest remaining colour (a navy text panel, dark inner boxes) became the section's background,
 * and both rendered dark. Which images are tints is measured from the files, which the tree does not
 * hold, so the caller passes it in; an image it could not measure is treated as a cover, as before.
 */
export type SeeThrough = (url: string) => boolean;

const COVERS: SeeThrough = () => false;

const isCovered = (node: CapturedNode, seeThrough: SeeThrough): boolean =>
    Boolean(node.background?.url) && !seeThrough(node.background!.url);

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

/**
 * The least opacity at which a translucent theme colour is matched as the solid colour of its RGB.
 *
 * **Set from two observed values, not derived.** Across the nine themes the jobs pin (2026-10-10),
 * the colour slots written with an alpha byte that could stand for a section colour were ParkCity -
 * Take 3's `surface.raised` `#f7f7f9f2` (0.95), the site's own grey, and The Vibe's `surface.overlay`
 * `#000000b3` (0.70), a translucent overlay that is not the site's black. 0.9 admits the first and
 * refuses the second; nothing else in the corpus sits between them. A theme with a solid colour written
 * at, say, 0.85, or an overlay at 0.92, is what would move it. Scrims (0.5) and ghost tints (0.08-0.14)
 * are translucent by design and stay out at any sensible value.
 */
const OPAQUE_ENOUGH = 0.9;

/** `#rrggbb`, or `#rrggbbaa` opaque enough to be matched as `#rrggbb`; null for anything else. */
const solidHex = (value: string): string | null => {
    const trimmed = value.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(trimmed)) {
        return trimmed;
    }
    if (
        /^#[0-9a-f]{8}$/.test(trimmed) &&
        parseInt(trimmed.slice(7, 9), 16) / 255 >= OPAQUE_ENOUGH
    ) {
        return trimmed.slice(0, 7);
    }
    return null;
};

/**
 * The theme's colour slots that can express a measured colour, with their resolved value and the
 * variable that carries it.
 *
 * Status colours (`feedback.*`) are never candidates, for any role: they mean a message's state, and
 * matched by distance alone they won Take 3's greys — pale blue for the header, pale pink for the
 * footer. A grey with no surface near it now falls to a surface or to no token at all.
 */
export const themeColourRoles = (manifest: ThemeManifest): ThemeColour[] => {
    const roles: ThemeColour[] = [];
    for (const slot of manifest.slots) {
        const value = slot.values?.light;
        const hex = typeof value === "string" ? solidHex(value) : null;
        if (!hex || isStatusColour(String(slot.path))) {
            continue;
        }
        const cssVariable = (slot.cssVariables ?? [])[0];
        if (!cssVariable) {
            continue;
        }
        roles.push({ path: String(slot.path), cssVariable, hex });
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

/**
 * A section's measured colours matched again against a theme, keeping what was measured.
 *
 * Cluster records each colour's token when it runs, and every later reader used that record. So a
 * matcher fix reached only runs clustered after it, and a theme re-pinned since Cluster ran was matched
 * against a theme the job no longer uses. Readers that hold the pinned manifest — Generate's prompt,
 * the theme fit — match again here, which is what the replay measured.
 */
export const rematchColours = (
    colours: ResolvedColour[],
    manifest: ThemeManifest
): ResolvedColour[] => {
    const roles = themeColourRoles(manifest);
    return colours.map(colour => {
        const token = nearest(colour.hex, colour.role, roles);
        return {
            ...colour,
            token: token
                ? { path: token.path, cssVariable: token.cssVariable, hex: token.hex }
                : null
        };
    });
};

/** Below this share of its area painted by its own backgrounds, a section shows its backdrop. */
const BACKDROP_SHOWS = 0.5;

/**
 * The colour behind a section: the background of its nearest ancestor that paints one.
 *
 * Null when that ancestor is painted with an image, when nothing up the tree paints at all, and when
 * the section is laid over the page rather than in it — absolutely or fixed positioned, itself or on
 * the way up: 2424 Tulane's header floats over the hero photograph, so what is behind it is the
 * photo, not the page colour its ancestor paints.
 */
export const backdropColour = (
    root: CapturedNode,
    target: CapturedNode,
    seeThrough: SeeThrough = COVERS
): string | null => {
    const path: CapturedNode[] = [];
    const find = (current: CapturedNode): boolean => {
        if (current === target) {
            return true;
        }
        path.push(current);
        for (const child of current.children ?? []) {
            if (find(child)) {
                return true;
            }
        }
        path.pop();
        return false;
    };
    if (!find(root)) {
        return null;
    }
    const overlays = (node: CapturedNode) =>
        node.styles?.position === "absolute" || node.styles?.position === "fixed";
    if (overlays(target)) {
        return null;
    }
    // A picture anywhere on the page under most of the section — a parallax layer, a positioned
    // background element — may be what shows through, and a colour would then be the wrong answer.
    // thevibe's "Like what you see?" band sits over a lawn photograph painted by a sibling.
    const box = target.box;
    const overlap = (other: CapturedNode["box"]) =>
        Math.max(0, Math.min(box.x + box.width, other.x + other.width) - Math.max(box.x, other.x)) *
        Math.max(
            0,
            Math.min(box.y + box.height, other.y + other.height) - Math.max(box.y, other.y)
        );
    const pictured = (current: CapturedNode): boolean => {
        if (current === target) {
            return false;
        }
        if (
            (isCovered(current, seeThrough) || current.tag === "img" || current.tag === "video") &&
            current !== root &&
            overlap(current.box) >= BACKDROP_SHOWS * box.width * box.height
        ) {
            return true;
        }
        return (current.children ?? []).some(pictured);
    };
    if (pictured(root)) {
        return null;
    }
    for (let i = path.length - 1; i >= 0; i--) {
        const ancestor = path[i];
        if (overlays(ancestor)) {
            return null;
        }
        if (isCovered(ancestor, seeThrough)) {
            return null;
        }
        const background = ancestor.styles?.backgroundColor;
        if (background && !isTransparent(background)) {
            return colorToHex(background);
        }
    }
    return null;
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
    manifest: ThemeManifest | null,
    backdrop: string | null = null,
    seeThrough: SeeThrough = COVERS
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

    // How much of the section its own backgrounds and pictures paint, to tell whether the backdrop
    // shows through.
    let paintedArea = 0;

    const walk = (current: CapturedNode): void => {
        const box = current.box;
        const area = box && box.width > 0 && box.height > 0 ? box.width * box.height : 0;
        if (area > 0) {
            const styles = current.styles ?? {};

            // A background image, or a picture laid in as an element, paints what is behind it.
            if (
                isCovered(current, seeThrough) ||
                current.tag === "img" ||
                current.tag === "video"
            ) {
                paintedArea += area;
            }
            const background = styles.backgroundColor;
            if (background && !isTransparent(background) && !isCovered(current, seeThrough)) {
                const hex = colorToHex(background);
                if (hex) {
                    add(ROLE_BY_PROP.backgroundColor, hex, area);
                    paintedArea += area;
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

    /*
     * A transparent section shows whatever is behind it. Freehill's header element paints nothing:
     * the teal band is an ancestor's background, so the section measured no background colour at
     * all and Generate gave the header the theme's white surface — with a white logo on it. Where
     * the section leaves most of itself unpainted, the backdrop is its background.
     */
    const sectionArea = node.box.width * node.box.height;
    if (backdrop && sectionArea > 0 && paintedArea < BACKDROP_SHOWS * sectionArea) {
        add(
            ROLE_BY_PROP.backgroundColor,
            backdrop,
            sectionArea - Math.min(paintedArea, sectionArea)
        );
    }

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

/**
 * The colour that shows through a see-through background image: what the section looks like where
 * the image is drawn.
 *
 * Taken where the image is, not from the section's colour list. Park city's pattern sits on the
 * section's root over the page's light backdrop, while the largest colour the section measures is the
 * navy of the text panel in front of it; naming the list's first background as "the colour under the
 * pattern" told Generate the pattern was over navy, which is the opposite of the page. So: the image
 * element's own background colour where it paints one, else the colour behind that element. Null when
 * neither can be read, and the caller says nothing rather than guessing.
 */
export const colourUnderImage = (
    root: CapturedNode,
    section: CapturedNode,
    url: string,
    manifest: ThemeManifest | null,
    seeThrough: SeeThrough
): Pick<ResolvedColour, "hex" | "token"> | null => {
    let host: CapturedNode | null = null;
    const find = (current: CapturedNode): void => {
        if (
            current.background?.url === url &&
            (!host || current.box.width * current.box.height > host.box.width * host.box.height)
        ) {
            host = current;
        }
        (current.children ?? []).forEach(find);
    };
    find(section);
    if (!host) {
        return null;
    }
    const element: CapturedNode = host;
    const own = element.styles?.backgroundColor;
    const hex =
        own && !isTransparent(own) ? colorToHex(own) : backdropColour(root, element, seeThrough);
    if (!hex) {
        return null;
    }
    const token = manifest ? nearest(hex, "background", themeColourRoles(manifest)) : null;
    return {
        hex,
        token: token ? { path: token.path, cssVariable: token.cssVariable, hex: token.hex } : null
    };
};
