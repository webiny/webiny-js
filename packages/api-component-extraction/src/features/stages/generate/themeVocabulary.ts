import { getTokenCatalog, type ThemeManifest } from "@webiny/theme-common";

/**
 * Extraction's override of the shared prompt's token vocabulary: the variables this site's theme
 * manifest defines, which are the ones Generate's validator accepts.
 *
 * The shared prompt lists every token `@webiny/theme-common` knows (142) under "the active theme
 * defines these", and its worked examples space components with the primitive scale
 * (`--wby-space-md`). A theme's manifest holds its semantic slots only (110-111), so the validator
 * rejected the primitives the prompt taught: 9 of 9 first attempts failed on them, and all 274 rejected
 * names were in the catalog. Here the catalog is the manifest's, each variable with what it is for and
 * the site's own value as its fallback, and the examples' variables the theme lacks are rewritten into
 * ones it has. See `ai-context/issues/the-shared-prompt-lists-variables-the-theme-manifest-does-not.md`.
 */

const GROUP_TITLES: Record<string, string> = {
    color: "Colours",
    type: "Typography — one variable per role sub-property (family, size, weight, line-height, letter-spacing)",
    space: "Spacing",
    radius: "Corner radius",
    shadow: "Shadow",
    border: "Border width"
};
const GROUP_ORDER = ["color", "type", "space", "radius", "shadow", "border"];

const SUB_PROPERTY: [RegExp, string][] = [
    [/-family$/, "fontFamily"],
    [/-size$/, "fontSize"],
    [/-weight$/, "fontWeight"],
    [/-line-height$/, "lineHeight"],
    [/-letter-spacing$/, "letterSpacing"]
];

interface VocabularyEntry {
    variable: string;
    value: string | null;
    description: string | null;
    group: string;
}

const valueOf = (value: unknown, variable: string): string | null => {
    if (typeof value === "string" || typeof value === "number") {
        return String(value);
    }
    if (value && typeof value === "object") {
        const key = SUB_PROPERTY.find(([pattern]) => pattern.test(variable))?.[1];
        const sub = key ? (value as Record<string, unknown>)[key] : undefined;
        if (Array.isArray(sub)) {
            return sub.join(", ");
        }
        return typeof sub === "string" || typeof sub === "number" ? String(sub) : null;
    }
    return null;
};

export const themeVocabulary = (manifest: ThemeManifest): VocabularyEntry[] => {
    const catalog = new Map(getTokenCatalog().map(entry => [entry.variable, entry]));
    return manifest.slots.flatMap(slot =>
        (slot.cssVariables ?? []).map(variable => {
            const known = catalog.get(variable);
            return {
                variable,
                value: valueOf(slot.values?.light, variable) ?? known?.fallback ?? null,
                description: known?.description ?? null,
                group: known?.group ?? String(slot.path).split(".")[0]
            };
        })
    );
};

const toPx = (value: string | null): number | null => {
    const match = value ? /^(-?[\d.]+)(px|rem|em)?$/.exec(value.trim()) : null;
    if (!match) {
        return null;
    }
    const n = parseFloat(match[1]);
    return match[2] === "rem" || match[2] === "em" ? n * 16 : n;
};

export interface SystemPromptOverride {
    tokenCatalog: string;
    rewriteExampleVariable: (variable: string, fallback: string) => string | null;
}

export const systemPromptOverride = (manifest: ThemeManifest): SystemPromptOverride => {
    const entries = themeVocabulary(manifest);
    const defined = new Set(entries.map(entry => entry.variable));

    const grouped = new Map<string, VocabularyEntry[]>();
    for (const entry of entries) {
        grouped.set(entry.group, [...(grouped.get(entry.group) ?? []), entry]);
    }
    const groups = [
        ...GROUP_ORDER.filter(group => grouped.has(group)),
        ...[...grouped.keys()].filter(group => !GROUP_ORDER.includes(group))
    ];
    const tokenCatalog = groups
        .map(group => {
            const lines = (grouped.get(group) ?? []).map(entry => {
                const reference = entry.value
                    ? `var(${entry.variable}, ${entry.value})`
                    : `var(${entry.variable})`;
                return entry.description
                    ? `- \`${reference}\` — ${entry.description}`
                    : `- \`${reference}\``;
            });
            return `### ${GROUP_TITLES[group] ?? group}\n${lines.join("\n")}`;
        })
        .join("\n\n");

    // The theme's spacing variables with a px value, for rewriting the examples' primitive spacing.
    const spacing = entries
        .filter(entry => entry.group === "space")
        .map(entry => ({ entry, px: toPx(entry.value) }))
        .filter(
            (candidate): candidate is { entry: VocabularyEntry; px: number } =>
                candidate.px !== null
        );

    const rewriteExampleVariable = (variable: string, fallback: string): string | null => {
        if (defined.has(variable)) {
            return null;
        }
        const px = toPx(fallback);
        if (variable.startsWith("--wby-space-") && px !== null && spacing.length > 0) {
            const nearest = spacing.reduce((best, candidate) =>
                Math.abs(candidate.px - px) < Math.abs(best.px - px) ? candidate : best
            );
            return `var(${nearest.entry.variable}, ${nearest.entry.value})`;
        }
        // A variable the theme does not define and no spacing slot stands in for: its fallback, so the
        // example still shows a value rather than a name the validator rejects.
        return fallback;
    };

    return { tokenCatalog, rewriteExampleVariable };
};
