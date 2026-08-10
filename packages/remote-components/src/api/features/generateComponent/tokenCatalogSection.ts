import { getTokenCatalog, type TokenCatalogEntry } from "@webiny/theme-common";

/**
 * Renders the theme token catalog as a grouped Markdown reference for the generation prompt.
 *
 * Derived from `@webiny/theme-common` so it always matches the tokens the active theme actually
 * defines on `:root` — the model is told to reference these via `var(--wby-…, <fallback>)` rather
 * than hardcode style values.
 */

const GROUP_TITLES: Readonly<Record<string, string>> = {
    color: "Colours",
    type: "Typography — one variable per role sub-property (family, size, weight, line-height, letter-spacing)",
    space: "Spacing",
    radius: "Corner radius",
    shadow: "Shadow",
    border: "Border width"
};

const GROUP_ORDER = ["color", "type", "space", "radius", "shadow", "border"] as const;

const formatEntry = (entry: TokenCatalogEntry): string => {
    const reference = `var(${entry.variable}, ${entry.fallback})`;
    return entry.description ? `- \`${reference}\` — ${entry.description}` : `- \`${reference}\``;
};

export const buildTokenCatalogSection = (): string => {
    const grouped = new Map<string, TokenCatalogEntry[]>();
    for (const entry of getTokenCatalog()) {
        const list = grouped.get(entry.group) ?? [];
        list.push(entry);
        grouped.set(entry.group, list);
    }

    // Known groups first in a deliberate order, then any others (defensive, so a new token group is
    // never silently dropped from the reference).
    const groups = [
        ...GROUP_ORDER.filter(group => grouped.has(group)),
        ...[...grouped.keys()].filter(group => !GROUP_ORDER.includes(group as never))
    ];

    return groups
        .map(group => {
            const title = GROUP_TITLES[group] ?? group;
            const entries = grouped.get(group) ?? [];
            return `### ${title}\n${entries.map(formatEntry).join("\n")}`;
        })
        .join("\n\n");
};
