import { parseColor, type Rgba } from "@webiny/theme-common";

/**
 * Ordering brand colors by how they look — greys first (light → dark), then chromatic colors by
 * hue and, within a hue, light → dark — so similar shades sit together and a duplicate is easy to
 * spot. Kept apart from the component so the ordering can be unit-tested on its own.
 */

// `parseColor` handles hex and rgb() only; an extracted theme can also hold hsl(), oklch() or named
// colors. A shared canvas context normalises any valid CSS color the browser understands into a
// hex/rgb string parseColor can read, so ordering works whatever format a token was authored in.
let sharedColorContext: CanvasRenderingContext2D | null | undefined;
const getColorContext = (): CanvasRenderingContext2D | null => {
    if (sharedColorContext === undefined) {
        sharedColorContext =
            typeof document !== "undefined"
                ? document.createElement("canvas").getContext("2d")
                : null;
    }
    return sharedColorContext;
};

const cssColorToRgba = (value: string): Rgba | null => {
    const direct = parseColor(value);
    if (direct) {
        return direct;
    }
    const context = getColorContext();
    if (!context) {
        return null;
    }
    // An unrecognised value leaves fillStyle unchanged, so it degrades gracefully rather than
    // throwing; a recognised one comes back as `#rrggbb` or `rgba(...)`.
    context.fillStyle = value;
    return parseColor(context.fillStyle);
};

// Chroma is the plain max−min of the channels (0–1). Unlike HSL *saturation* it does not blow up
// for near-white or near-black colors, so a pale tint or a dark slate reads as near-neutral instead
// of a fully saturated hue — which is what keeps them grouped with the greys rather than scattered.
const rgbToHlc = ({ r, g, b }: Rgba): { h: number; l: number; c: number } => {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const c = max - min;
    const l = (max + min) / 2;

    if (c === 0) {
        return { h: 0, l, c };
    }

    let h: number;
    if (max === rn) {
        h = ((gn - bn) / c) % 6;
    } else if (max === gn) {
        h = (bn - rn) / c + 2;
    } else {
        h = (rn - gn) / c + 4;
    }
    h *= 60;
    return { h: h < 0 ? h + 360 : h, l, c };
};

/** Below this raw chroma a color is neutral — covers greys, pale tints and low-chroma slates. */
const NEUTRAL_CHROMA = 0.18;

/**
 * Perceived colorfulness = chroma weighted by how mid-toned the color is (0 at pure black/white,
 * 1 at 50% lightness). A near-black with real chroma — a dark maroon or navy — still reads as "dark",
 * not as a hue, so below this it groups with the neutrals rather than splitting the vivid colors.
 */
const NEUTRAL_EFFECTIVE_CHROMA = 0.09;

/**
 * Bucket, primary and secondary sort fields, compared in turn. Buckets: 0 = greys, 1 = chromatic,
 * 2 = unparseable (ordered by their raw string, so identical values still cluster).
 */
export interface ColorSortKey {
    bucket: number;
    primary: number;
    secondary: number;
    raw: string;
}

export const colorSortKey = (value: unknown): ColorSortKey => {
    const raw = typeof value === "string" ? value.toLowerCase() : "";
    const rgb = typeof value === "string" ? cssColorToRgba(value) : null;
    if (!rgb) {
        return { bucket: 2, primary: 0, secondary: 0, raw };
    }

    const { h, l, c } = rgbToHlc(rgb);
    const effectiveChroma = c * (1 - Math.abs(2 * l - 1));
    if (c < NEUTRAL_CHROMA || effectiveChroma < NEUTRAL_EFFECTIVE_CHROMA) {
        // Greys, whites, blacks, pale tints and near-black colors — one group, light → dark.
        return { bucket: 0, primary: 1 - l, secondary: 0, raw };
    }
    // Chromatic — grouped by hue, then light → dark within a hue.
    return { bucket: 1, primary: h, secondary: 1 - l, raw };
};

export const compareColorKeys = (a: ColorSortKey, b: ColorSortKey): number =>
    a.bucket - b.bucket ||
    a.primary - b.primary ||
    a.secondary - b.secondary ||
    a.raw.localeCompare(b.raw);

/** Returns a new array of `items` ordered by the color each one resolves to via `getValue`. */
export const sortByColor = <T>(items: readonly T[], getValue: (item: T) => unknown): T[] =>
    [...items].sort((a, b) =>
        compareColorKeys(colorSortKey(getValue(a)), colorSortKey(getValue(b)))
    );
