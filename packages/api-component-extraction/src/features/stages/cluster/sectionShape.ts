import type { ThemeManifest } from "@webiny/theme-common";
import type { CapturedNode, SectionShape, TypeNode } from "~/domain/artifacts.js";

/** The element-type tree shape — tags only, depth-capped so a deep section stays a bounded fingerprint. */
export const toTypeTree = (node: CapturedNode, maxDepth = 6): TypeNode => ({
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
        typeTree: toTypeTree(node),
        geometryClass: geometryClass(node, viewportWidth),
        tokens: [...tokens]
    };
};
