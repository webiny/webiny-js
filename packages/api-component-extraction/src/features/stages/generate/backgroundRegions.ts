import type { ThemeManifest } from "@webiny/theme-common";
import type {
    BackgroundRegion,
    CapturedNode,
    PlannedComponent,
    RegionPaint,
    ResolvedColour
} from "~/domain/artifacts.js";
import { rematchColours } from "~/features/stages/cluster/resolvedColours.js";
import { crossesFamily } from "./colourFamilies.js";

/**
 * A section's background as regions: what paints each part of it, and where.
 *
 * The prompt described a section's background in section-wide facts — a colour list ordered by area, a
 * background image "on the section" — and area share cannot express a region. Park City's Property
 * Description is a see-through pattern over a light backdrop with a navy panel in front of part of it;
 * told both as the section's background, the model put both on one element and the pattern tiled across
 * the navy. Measured on the latest run of each site (2026-10-10), 28 of 119 sections have more than one
 * background region and 11 have an image region beside a colour region. Those counts are a lower bound:
 * a region drawn by a pseudo-element is not in the capture (Take 3's Apartment Intro Hero measures as
 * all pattern where its source has a slate panel).
 */

/**
 * The least share of the section a paint must cover to be a region.
 *
 * **Set from the sections measured on 2026-10-10, not derived.** Below it are a section's buttons,
 * badges and dividers (Take 3's terracotta buttons cover 1-2%), which stay in the colour list as they
 * are; at and above it are panels and columns (the smallest W2 region measured is a 23% navy panel). It is
 * a separation between parts and decorations on this corpus, not a perceptual rule.
 */
const REGION_SHARE = 0.15;

/**
 * Two colours closer than this in RGB are one paint.
 *
 * **Set from the observed distribution, as the theme fit's 6 was.** The two-tone pairs on the latest runs
 * sit at 12 and above, with a gap to 240 after the near-white ones. The near-white pairs were checked
 * against the screenshot and are design, not capture: Take 3's white card on light grey (255 against 237)
 * and webiny.com's grey card on white (245 against 255). Below 6 are capture duplicates — the same colour
 * recorded twice, once with 0.95 opacity (Take 3's header). It separates same paint from different paint;
 * it is not a contrast threshold for what a person can see.
 */
const SAME_PAINT = 6;

/** Grid resolution over the section, per side. */
const GRID = 20;

/** Colours this translucent are an overlay, not the colour of a region. */
const OPAQUE_ENOUGH = 0.9;

type Rgb = [number, number, number];

const toHex = ([r, g, b]: Rgb): string =>
    `#${[r, g, b]
        .map(v =>
            Math.max(0, Math.min(255, Math.round(v)))
                .toString(16)
                .padStart(2, "0")
        )
        .join("")}`;

/** OKLCH, as browsers report colours written in it, to sRGB. */
const oklchToRgb = (l: number, c: number, h: number): Rgb => {
    const a = c * Math.cos((h * Math.PI) / 180);
    const b = c * Math.sin((h * Math.PI) / 180);
    const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const lin = [
        4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
        -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
        -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_
    ];
    const gamma = (v: number) =>
        (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) * 255;
    return lin.map(gamma) as Rgb;
};

/** A computed colour as RGB, or null when it is transparent or too translucent to be a region. */
export const parseColour = (value: string | undefined): Rgb | null => {
    if (!value) {
        return null;
    }
    const rgb = value.match(
        /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/i
    );
    if (rgb) {
        const alpha = rgb[4] ? parseFloat(rgb[4]) / (rgb[4].endsWith("%") ? 100 : 1) : 1;
        return alpha >= OPAQUE_ENOUGH ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
    }
    const oklch = value.match(
        /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/i
    );
    if (oklch) {
        const alpha = oklch[4] ? parseFloat(oklch[4]) / (oklch[4].endsWith("%") ? 100 : 1) : 1;
        if (alpha < OPAQUE_ENOUGH) {
            return null;
        }
        const l = parseFloat(oklch[1]) / (oklch[1].endsWith("%") ? 100 : 1);
        return oklchToRgb(l, parseFloat(oklch[2]), parseFloat(oklch[3]));
    }
    const hex = value.trim().match(/^#([0-9a-f]{6})$/i);
    return hex
        ? [
              parseInt(hex[1].slice(0, 2), 16),
              parseInt(hex[1].slice(2, 4), 16),
              parseInt(hex[1].slice(4, 6), 16)
          ]
        : null;
};

type RawPaint = { kind: "colour"; rgb: Rgb } | { kind: "image"; url: string; node: CapturedNode };

const paintOf = (node: CapturedNode): RawPaint | null => {
    if (node.background?.url) {
        return { kind: "image", url: node.background.url, node };
    }
    const rgb = parseColour(node.styles?.backgroundColor);
    return rgb ? { kind: "colour", rgb } : null;
};

const distance = (a: Rgb, b: Rgb) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const samePaint = (a: RawPaint, b: RawPaint): boolean =>
    a.kind === "image" && b.kind === "image"
        ? a.url === b.url
        : a.kind === "colour" && b.kind === "colour" && distance(a.rgb, b.rgb) < SAME_PAINT;

/** The first text inside a node, depth first: a heading, a label, a field's name. */
const firstText = (node: CapturedNode): string | null => {
    const own = (node.text ?? node.alt ?? "").replace(/\s+/g, " ").trim();
    if (own) {
        return own;
    }
    for (const child of node.children ?? []) {
        const found = firstText(child);
        if (found) {
            return found;
        }
    }
    return null;
};

const HOLDS_LENGTH = 60;

/**
 * Which element paints a region, said by what it holds.
 *
 * The region's box is where the paint shows in the capture, and the capture can be smaller than the
 * source: Take 3's Neighborhood Overview has one navy element at x 50-95%, y 25-75% where the source's
 * panel is far wider (a pseudo-element the capture does not record). Given that box as coordinates, the
 * model drew a navy box of exactly that size and the text ran out of it. Naming the element by its text
 * says which element carries the paint; it does not make the captured extent right.
 */
const holdsOf = (
    layers: { node: CapturedNode | null; box: CapturedNode["box"] }[]
): Pick<BackgroundRegion, "holds" | "empty"> => {
    const largest = layers
        .filter(layer => layer.node)
        .sort((a, b) => b.box.width * b.box.height - a.box.width * a.box.height)[0];
    if (!largest?.node) {
        // The section's own paint, or its backdrop showing through: no element to name.
        return {};
    }
    const text = firstText(largest.node);
    if (!text) {
        return { empty: true };
    }
    return { holds: text.length > HOLDS_LENGTH ? `${text.slice(0, HOLDS_LENGTH).trimEnd()}…` : text };
};

/**
 * The section's background regions, or null when it has one background (the prompt is then unchanged).
 *
 * At each point of a grid over the section, the top-most CSS background painting there — a colour or a
 * background image; `<img>` elements are content, not background. Where the section paints nothing, its
 * nearest painting ancestor shows through. A paint covering `REGION_SHARE` or more is a region.
 */
export const sectionBackgroundRegions = (params: {
    section: CapturedNode;
    /** The section's ancestors, nearest last, for what shows through where it paints nothing. */
    ancestors: CapturedNode[];
    manifest: ThemeManifest | null;
    backgroundImages?: PlannedComponent["backgroundImages"];
}): BackgroundRegion[] | null => {
    const { section, ancestors, manifest, backgroundImages } = params;
    const box = section.box;
    if (!box || box.width <= 0 || box.height <= 0) {
        return null;
    }

    const layers: { box: CapturedNode["box"]; paint: RawPaint; node: CapturedNode | null }[] = [];
    const own = paintOf(section);
    if (own) {
        layers.push({ box, paint: own, node: null });
    }
    const walk = (node: CapturedNode): void => {
        for (const child of node.children ?? []) {
            const paint = paintOf(child);
            if (paint && child.box && child.box.width > 0 && child.box.height > 0) {
                layers.push({ box: child.box, paint, node: child });
            }
            walk(child);
        }
    };
    walk(section);
    const backdrop = [...ancestors].reverse().map(paintOf).find(Boolean) ?? null;

    // Distinct paints, merged where they are the same paint; the backdrop is layer 0.
    const paints: RawPaint[] = [];
    const indexOf = (paint: RawPaint): number => {
        const found = paints.findIndex(other => samePaint(other, paint));
        if (found >= 0) {
            return found;
        }
        paints.push(paint);
        return paints.length - 1;
    };
    const backdropIndex = backdrop ? indexOf(backdrop) : -1;
    const layerIndex = layers.map(layer => indexOf(layer.paint));

    const cells = new Map<
        number,
        { count: number; x0: number; y0: number; x1: number; y1: number; top: number }
    >();
    for (let i = 0; i < GRID; i++) {
        for (let j = 0; j < GRID; j++) {
            const x = box.x + ((i + 0.5) * box.width) / GRID;
            const y = box.y + ((j + 0.5) * box.height) / GRID;
            let paint = backdropIndex;
            let depth = 0;
            layers.forEach((layer, index) => {
                const b = layer.box;
                if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
                    paint = layerIndex[index];
                    depth = index + 1;
                }
            });
            if (paint < 0) {
                continue;
            }
            const cell = cells.get(paint) ?? { count: 0, x0: i, y0: j, x1: i, y1: j, top: depth };
            cell.count++;
            cell.x0 = Math.min(cell.x0, i);
            cell.y0 = Math.min(cell.y0, j);
            cell.x1 = Math.max(cell.x1, i);
            cell.y1 = Math.max(cell.y1, j);
            cell.top = Math.min(cell.top, depth);
            cells.set(paint, cell);
        }
    }

    const regions = [...cells.entries()]
        .map(([index, cell]) => ({ index, cell, share: cell.count / (GRID * GRID) }))
        .filter(region => region.share >= REGION_SHARE);
    if (regions.length < 2) {
        return null;
    }

    const imageFacts = new Map((backgroundImages ?? []).map(image => [image.url, image]));
    const colourToken = (rgb: Rgb): ResolvedColour["token"] => {
        if (!manifest) {
            return null;
        }
        const [matched] = rematchColours(
            [{ role: "background", hex: toHex(rgb), area: 1, token: null }],
            manifest
        );
        return matched.token && !crossesFamily("background", matched.token.path)
            ? matched.token
            : null;
    };

    return regions
        .sort((a, b) => a.cell.top - b.cell.top || b.share - a.share)
        .map((region, layer): BackgroundRegion => {
            const raw = paints[region.index];
            const pct = (cells: number) => Math.round((cells * 100) / GRID);
            const paint: RegionPaint =
                raw.kind === "colour"
                    ? { kind: "colour", hex: toHex(raw.rgb), token: colourToken(raw.rgb) }
                    : (() => {
                          const facts = imageFacts.get(raw.url);
                          const background = raw.node.background;
                          return {
                              kind: "image" as const,
                              url: raw.url,
                              ...(background?.size ? { size: background.size } : {}),
                              ...(background?.position ? { position: background.position } : {}),
                              ...(background?.repeat ? { repeat: background.repeat } : {}),
                              ...(facts?.opacity !== undefined ? { opacity: facts.opacity } : {}),
                              // Matched here, not taken from Plan's record: a stored token can be one the
                              // matcher no longer gives (a status colour, before 2026-10-10).
                              ...(facts?.under
                                  ? {
                                        under: {
                                            hex: facts.under.hex,
                                            token: (() => {
                                                const rgb = parseColour(facts.under.hex);
                                                return rgb ? colourToken(rgb) : null;
                                            })()
                                        }
                                    }
                                  : {})
                          };
                      })();
            return {
                ...holdsOf(layers.filter((_, i) => layerIndex[i] === region.index)),
                paint,
                box: {
                    x: pct(region.cell.x0),
                    y: pct(region.cell.y0),
                    width: pct(region.cell.x1 - region.cell.x0 + 1),
                    height: pct(region.cell.y1 - region.cell.y0 + 1)
                },
                share: Math.round(region.share * 100) / 100,
                layer
            };
        });
};
