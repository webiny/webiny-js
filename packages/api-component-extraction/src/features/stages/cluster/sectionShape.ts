import type { ThemeManifest } from "@webiny/theme-common";
import type { CapturedNode, SectionShape, TypeNode } from "~/domain/artifacts.js";

/** The fixed depth the fingerprint used before it was anchored at a section's content. */
export const LEGACY_DEPTH = 6;
/** How far below its first content element a section is fingerprinted. */
const BELOW_CONTENT = 5;

/** Elements that are content rather than layout: what a section shows and does. */
const CONTENT_TAGS = new Set([
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "img",
    "picture",
    "video",
    "iframe",
    "svg",
    "a",
    "button",
    "form",
    "input",
    "select",
    "textarea",
    "label",
    "ul",
    "ol"
]);

/** The depth of a section's shallowest content element below its root, or null when it has none. */
export const firstContentDepth = (node: CapturedNode, depth = 0): number | null => {
    if (depth > 0 && CONTENT_TAGS.has(node.tag)) {
        return depth;
    }
    let best: number | null = null;
    for (const child of node.children ?? []) {
        const found = firstContentDepth(child, depth + 1);
        if (found !== null && (best === null || found < best)) {
            best = found;
        }
    }
    return best;
};

/**
 * How deep a section is fingerprinted: from its root to a fixed distance below its first content.
 *
 * A fixed depth of 6 fingerprinted the wrapper stack on templates whose first heading sits at depth 8 or
 * 9 (four of the five demo sites), so a photo carousel, an apply-now hero and a tour form read as the
 * same shape and clustered together. Anchoring the depth at the content keeps a shallow section's
 * fingerprint exactly as it was.
 */
export const fingerprintDepth = (node: CapturedNode): number =>
    Math.max(LEGACY_DEPTH, (firstContentDepth(node) ?? 1) + BELOW_CONTENT);

/** The element-type tree shape — tags only, depth-capped so a deep section stays a bounded fingerprint. */
export const toTypeTree = (node: CapturedNode, maxDepth = LEGACY_DEPTH): TypeNode => ({
    tag: node.tag,
    children: maxDepth <= 0 ? [] : node.children.map(child => toTypeTree(child, maxDepth - 1))
});

const clamp = (n: number): number => Math.max(0, Math.min(255, Math.round(n)));
const hex2 = (n: number): string => clamp(n).toString(16).padStart(2, "0");

/** Normalise a computed color to lowercase hex, or null if it is not an rgb/rgba color. */
export const colorToHex = (value: string): string | null => {
    const match = /rgba?\(([^)]+)\)/i.exec(value);
    if (!match) {
        return null;
    }
    const parts = match[1].split(",").map(part => parseFloat(part.trim()));
    if (parts.length < 3 || parts.some(Number.isNaN)) {
        return null;
    }
    return `#${hex2(parts[0])}${hex2(parts[1])}${hex2(parts[2])}`;
};

const COLOR_PROPS = ["backgroundColor", "color", "borderTopColor"];

const collectColors = (node: CapturedNode, out: Set<string>): void => {
    for (const prop of COLOR_PROPS) {
        const value = node.styles[prop];
        if (value) {
            const hex = colorToHex(value);
            if (hex) {
                out.add(hex);
            }
        }
    }
    node.children.forEach(child => collectColors(child, out));
};

/**
 * The coarse layout-geometry class: a width bucket plus a column count (direct children grouped into
 * horizontal bands). Stable and discriminating without being pixel-exact.
 */
export const geometryClass = (node: CapturedNode, viewportWidth: number): string => {
    const width = node.box.width >= 0.9 * viewportWidth ? "full" : "contained";
    const bands = new Map<number, number>();
    for (const child of node.children) {
        const band = Math.round(child.box.y / 50);
        bands.set(band, (bands.get(band) ?? 0) + 1);
    }
    const columns = bands.size ? Math.max(...bands.values()) : 0;
    return `${width}-cols${columns}`;
};

export interface TokenLookup {
    colorHexToPath: Map<string, string>;
}

/** A lookup from a manifest color slot's hex value to its token path, for resolving a section's colors. */
export const buildTokenLookup = (manifest: ThemeManifest): TokenLookup => {
    const colorHexToPath = new Map<string, string>();
    for (const slot of manifest.slots) {
        const value = slot.values.light;
        if (typeof value === "string" && value.startsWith("#")) {
            colorHexToPath.set(value.toLowerCase(), String(slot.path));
        }
    }
    return { colorHexToPath };
};

/**
 * A section's structural fingerprint inputs. Tokens are resolved best-effort from the section's colors
 * against the theme manifest — Phase 1 resolves colors only; font and spacing binding is fuzzier and
 * deferred. Text content and image URLs never enter the shape.
 */
export const sectionShape = (
    node: CapturedNode,
    viewportWidth: number,
    lookup: TokenLookup
): SectionShape => {
    const colors = new Set<string>();
    collectColors(node, colors);

    const tokens = new Set<string>();
    for (const hex of colors) {
        const path = lookup.colorHexToPath.get(hex);
        if (path) {
            tokens.add(path);
        }
    }

    return {
        typeTree: toTypeTree(node, fingerprintDepth(node)),
        geometryClass: geometryClass(node, viewportWidth),
        tokens: [...tokens]
    };
};
