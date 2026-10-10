import { createDefaultThemeDocument } from "@webiny/theme-common";
import type { ThemeDocumentsDto } from "~/shared/types.js";

/**
 * What extraction set on a theme, for the run view's palette: only the slots it changed from the default
 * document, never the theme as a whole.
 *
 * The whole theme would overclaim. 71 Westland's theme carries 37 brand colours, and every one is the
 * default slate/blue/green ramp; extraction instead points the semantic slots at colours it read off the
 * site, and adds brand tokens it never uses (a blue `primary-hover` no slot refers to). Its font is the
 * default Inter, while the site sets Montserrat. So a slot counts only where its raw value — the alias,
 * not the resolved colour — differs from the default document's. A slot set to the same alias as the
 * default reads as not extracted, which undercounts; that is the side to be wrong on.
 */
const PALETTE_SLOTS = [
    "color.surface.page",
    "color.surface.sunken",
    "color.text.primary",
    "color.text.secondary",
    "color.text.muted",
    "color.text.link",
    "color.border.default",
    "color.border.subtle",
    "color.action.primary.background",
    "color.action.secondary.background"
];

const SIZE_SLOTS: Array<[label: string, path: string]> = [
    ["H1", "type.heading.1"],
    ["H2", "type.heading.2"],
    ["H3", "type.heading.3"],
    ["Body", "type.body"]
];

export interface ThemeSnapshot {
    /** Distinct colours the extracted slots resolve to, in slot order. */
    colours: Array<{ value: string; slots: string[] }>;
    /** Type sizes from extracted type styles. */
    sizes: Array<{ label: string; size: string }>;
    font: { family: string; extracted: boolean } | null;
}

type Doc = Record<string, unknown>;

const rawValue = (doc: unknown, path: string): unknown => {
    let node: unknown = doc;
    for (const key of path.split(".")) {
        if (!node || typeof node !== "object") {
            return undefined;
        }
        node = (node as Doc)[key];
    }
    return node && typeof node === "object" ? (node as Doc)["$value"] : undefined;
};

const changed = (tokens: unknown, defaults: unknown, path: string): boolean => {
    const value = rawValue(tokens, path);
    return (
        value !== undefined && JSON.stringify(value) !== JSON.stringify(rawValue(defaults, path))
    );
};

const resolvedLight = (resolved: unknown): Map<string, unknown> => {
    const light = (resolved as { modes?: { light?: Array<{ path: string; value: unknown }> } })
        ?.modes?.light;
    return new Map((light ?? []).map(token => [token.path, token.value]));
};

export const themeSnapshot = (
    theme: ThemeDocumentsDto,
    defaults: unknown = createDefaultThemeDocument()
): ThemeSnapshot => {
    const values = resolvedLight(theme.resolved);

    const colours: ThemeSnapshot["colours"] = [];
    for (const slot of PALETTE_SLOTS) {
        const value = values.get(slot);
        if (typeof value !== "string" || !changed(theme.tokens, defaults, slot)) {
            continue;
        }
        const existing = colours.find(colour => colour.value.toLowerCase() === value.toLowerCase());
        if (existing) {
            existing.slots.push(slot);
        } else {
            colours.push({ value, slots: [slot] });
        }
    }

    const sizes: ThemeSnapshot["sizes"] = [];
    for (const [label, path] of SIZE_SLOTS) {
        const style = values.get(path) as { fontSize?: unknown } | undefined;
        if (typeof style?.fontSize === "string" && changed(theme.tokens, defaults, path)) {
            sizes.push({ label, size: style.fontSize });
        }
    }

    const family = values.get("font.sans");
    const font =
        typeof family === "string"
            ? { family, extracted: changed(theme.tokens, defaults, "font.sans") }
            : null;

    return { colours, sizes, font };
};
