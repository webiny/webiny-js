import {
    createDefaultThemeDocument,
    getTokenAtPath,
    isTypographyValue,
    parseAlias,
    parseLength,
    setTokenValue,
    setTypographySubProperty,
    splitPath,
    TEXT_STEPS,
    toAlias,
    toRem,
    type ThemeSettings,
    type TokenDocument
} from "@webiny/theme-common";
import type {
    AcceptedAssignment,
    ModelTypographyValue,
    ValidatedAssignment
} from "./tokenAssignment.js";

/**
 * Turning the model's answer into a token document.
 *
 * Built by applying assignments onto the default theme rather than by constructing a document from
 * scratch. That is what makes a partial answer safe: every canonical slot already holds a working
 * value, so an unassigned slot is a considered default rather than a hole, and the model is free to
 * decline a guess without producing a broken theme.
 */

const TYPOGRAPHY_SUB_PROPERTIES = [
    "fontFamily",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "letterSpacing"
] as const;

type TypographySubProperty = (typeof TYPOGRAPHY_SUB_PROPERTIES)[number];

/** A font family the model returned, resolved onto one of the theme's font keys. */
export interface DerivedFont {
    /** The font key the roles alias — `sans` or `mono`. */
    key: string;
    family: string;
    /** Weights the roles actually asked for, so the loader requests the ones the theme uses. */
    weights: number[];
}

export interface AppliedAssignment {
    document: TokenDocument;
    /** Paths actually written, for the theme's metadata. */
    applied: string[];
    /**
     * The site's fonts, resolved onto the theme's font set. Empty when the model named no real family
     * (only generic keywords, or nothing), in which case the defaults stand.
     */
    fonts: DerivedFont[];
    /**
     * Paths the model assigned and validation accepted, but which could not be written.
     *
     * Should be empty: validation already checked the path is canonical and the shape matches. Anything
     * here means the document and the canonical list disagree, which is worth surfacing rather than
     * swallowing.
     */
    failed: Array<{ path: string; reason: string }>;
}

/** CSS generic family keywords and system stacks — real, but not a Google font we can load by name. */
const GENERIC_FAMILIES = new Set([
    "serif",
    "sans-serif",
    "monospace",
    "cursive",
    "fantasy",
    "system-ui",
    "ui-sans-serif",
    "ui-serif",
    "ui-monospace",
    "ui-rounded",
    "-apple-system",
    "blinkmacsystemfont",
    "inherit",
    "initial",
    "unset"
]);

/**
 * The named family from a CSS font value: the first entry of a stack, unquoted. Returns null for a
 * generic keyword or an empty value, so a role that only resolves to `sans-serif` keeps the default.
 */
const namedFamily = (value: string): string | null => {
    const first = value
        .split(",")[0]
        ?.trim()
        .replace(/^['"]|['"]$/g, "")
        .trim();
    if (!first) {
        return null;
    }
    return GENERIC_FAMILIES.has(first.toLowerCase()) ? null : first;
};

/** A standard Google Fonts weight; anything off the 100-step scale is dropped rather than requested. */
const isStandardWeight = (weight: number): boolean =>
    Number.isInteger(weight) && weight >= 100 && weight <= 900 && weight % 100 === 0;

/** The font key a role currently aliases (`{font.sans}` → `sans`), defaulting to the body font. */
const roleFontKey = (document: TokenDocument, path: string): string => {
    const token = getTokenAtPath(document, path);
    const value = token && isTypographyValue(token.$value) ? token.$value : undefined;
    const target = value ? parseAlias(value.fontFamily) : null;
    return (target ? splitPath(target).pop() : undefined) ?? "sans";
};

/**
 * The ramp step whose size is closest to a measured length, so a role's `fontSize` becomes a
 * reference to the scale rather than a one-off literal. Returns undefined for a non-length value, in
 * which case the role keeps the default alias it already carries.
 */
const nearestTextStep = (document: TokenDocument, size: string): string | undefined => {
    const parsed = parseLength(size);
    if (!parsed) {
        return undefined;
    }

    const target = toRem(parsed);
    let bestStep: string | undefined;
    let bestDiff = Number.POSITIVE_INFINITY;

    for (const step of TEXT_STEPS) {
        const token = getTokenAtPath(document, `text.${step}`);
        const stepValue = typeof token?.$value === "string" ? parseLength(token.$value) : null;
        if (!stepValue) {
            continue;
        }
        const diff = Math.abs(toRem(stepValue) - target);
        if (diff < bestDiff) {
            bestDiff = diff;
            bestStep = step;
        }
    }

    return bestStep;
};

interface FontTally {
    families: Map<string, number>;
    weights: Set<number>;
}

/**
 * Applies one role. Sizes snap to the ramp and the family is recorded against the role's font (rather
 * than written as a literal), so a generated role references the font set and the scale exactly as a
 * hand-made one does — which is what lets the editor show its Font and Step, and editing either cascade.
 */
const applyTypography = (
    document: TokenDocument,
    path: string,
    value: ModelTypographyValue,
    tallies: Map<string, FontTally>
): TokenDocument => {
    let next = document;
    const key = roleFontKey(next, path);
    const tally = tallies.get(key) ?? { families: new Map(), weights: new Set() };
    tallies.set(key, tally);

    for (const property of TYPOGRAPHY_SUB_PROPERTIES) {
        const subValue = value[property as TypographySubProperty];
        if (subValue === undefined) {
            continue;
        }

        if (property === "fontFamily") {
            // An alias is honoured as-is; a literal family is recorded against the role's font and the
            // role left aliasing that font, so the site's family loads once and every role follows it.
            if (typeof subValue === "string" && parseAlias(subValue)) {
                next = setTypographySubProperty(next, path, property, subValue);
            } else if (typeof subValue === "string") {
                const family = namedFamily(subValue);
                if (family) {
                    tally.families.set(family, (tally.families.get(family) ?? 0) + 1);
                }
            }
            continue;
        }

        if (property === "fontSize") {
            if (typeof subValue === "string" && parseAlias(subValue)) {
                next = setTypographySubProperty(next, path, property, subValue);
            } else if (typeof subValue === "string") {
                const step = nearestTextStep(next, subValue);
                if (step) {
                    next = setTypographySubProperty(next, path, property, toAlias(`text.${step}`));
                }
            }
            continue;
        }

        // Weights and line heights arrive as either a number or a string depending on how the model
        // phrased them; both are valid DTCG values, so neither is coerced.
        if (property === "fontWeight") {
            const numeric =
                typeof subValue === "number" ? subValue : Number.parseInt(String(subValue), 10);
            if (isStandardWeight(numeric)) {
                tally.weights.add(numeric);
            }
        }
        next = setTypographySubProperty(next, path, property, subValue);
    }

    return next;
};

/** The winning family per font key (most cited), with the weights its roles used. */
const resolveFonts = (tallies: Map<string, FontTally>): DerivedFont[] => {
    const fonts: DerivedFont[] = [];

    for (const [key, tally] of tallies) {
        let family: string | undefined;
        let best = -1;
        for (const [candidate, count] of tally.families) {
            if (count > best) {
                best = count;
                family = candidate;
            }
        }
        if (family) {
            fonts.push({ key, family, weights: [...tally.weights].sort((a, b) => a - b) });
        }
    }

    return fonts;
};

/**
 * Folds the site's fonts into theme settings: the family the roles reference, plus any weights they
 * use added to the ones the font already loads. A font key the extraction did not touch is untouched.
 */
export const applyDerivedFonts = (settings: ThemeSettings, fonts: DerivedFont[]): ThemeSettings => {
    if (fonts.length === 0) {
        return settings;
    }

    const byKey = new Map(fonts.map(font => [font.key, font]));

    return {
        ...settings,
        fonts: settings.fonts.map(font => {
            const derived = byKey.get(font.key);
            if (!derived) {
                return font;
            }
            const weights = [...new Set([...font.weights, ...derived.weights])].sort(
                (a, b) => a - b
            );
            return { ...font, family: derived.family, weights };
        })
    };
};

const applyScalar = (
    document: TokenDocument,
    entry: AcceptedAssignment,
    mode: "light" | "dark"
): TokenDocument => {
    return setTokenValue(document, entry.path, mode, entry.value as string);
};

/**
 * Applies a validated assignment, starting from the default theme.
 *
 * Scalars first (colours, ramps, shadows), then roles — a role's size snaps to the text ramp, so the
 * ramp must already hold the model's sizes before the roles are read. Within the scalars, light values
 * precede dark: a dark value is a mode override on the token, so the token has to hold its light value
 * before the override means anything.
 */
export const applyAssignment = (validated: ValidatedAssignment): AppliedAssignment => {
    let document = createDefaultThemeDocument();
    const applied: string[] = [];
    const failed: Array<{ path: string; reason: string }> = [];
    const tallies = new Map<string, FontTally>();

    const attempt = (
        entry: AcceptedAssignment,
        run: () => TokenDocument,
        mode: "light" | "dark"
    ) => {
        try {
            document = run();
            applied.push(mode === "dark" ? `${entry.path} (dark)` : entry.path);
        } catch (error) {
            // One slot the document will not accept must not lose the rest of the theme.
            failed.push({
                path: entry.path,
                reason: error instanceof Error ? error.message : String(error)
            });
        }
    };

    const roles = validated.accepted.filter(entry => entry.type === "typography");
    const scalars = validated.accepted.filter(entry => entry.type !== "typography");

    for (const entry of scalars) {
        attempt(entry, () => applyScalar(document, entry, "light"), "light");
    }

    for (const entry of validated.darkAccepted) {
        attempt(entry, () => applyScalar(document, entry, "dark"), "dark");
    }

    for (const entry of roles) {
        attempt(
            entry,
            () =>
                applyTypography(document, entry.path, entry.value as ModelTypographyValue, tallies),
            "light"
        );
    }

    return { document, applied, failed, fonts: resolveFonts(tallies) };
};

export interface ExtractionMetadata {
    source: "extraction";
    entryUrl: string;
    sampledUrls: string[];
    crawledOn: string;
    model: string;
    confidence: string;
    summary: string;
    /** What the model was unsure of, shown in the review banner. */
    uncertain: Array<{ path: string; reason: string }>;
    /** What we discarded, so an odd theme can be explained rather than guessed at. */
    discarded: Array<{ path: string; reason: string }>;
    appliedCount: number;
}
