import {
    CANONICAL_COLOR_SLOTS,
    childNames,
    createDefaultThemeDocument,
    getNodeAtPath,
    getTokenAtPath,
    isDesignToken,
    isTokenGroup,
    isTypographyValue,
    META_EXTENSION,
    MODES_EXTENSION,
    parseAlias,
    parseLength,
    removeNodeAtPath,
    setNodeAtPath,
    setTokenReference,
    setTokenValue,
    setTypographySubProperty,
    splitPath,
    TEXT_STEPS,
    toAlias,
    toRem,
    walkTokens,
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

/** One extracted colour bound for a slot, kept with its mode so light and dark are linked separately. */
interface ColorLink {
    path: string;
    mode: "light" | "dark";
    value: string;
}

/** Canonical order and metadata, so a brand colour is named after the slot that first introduces it. */
const COLOR_SLOT_ORDER = new Map(CANONICAL_COLOR_SLOTS.map((slot, index) => [slot.path, index]));
const COLOR_SLOT_BY_PATH = new Map(CANONICAL_COLOR_SLOTS.map(slot => [slot.path, slot]));

/** Short, palette-friendly base name per canonical colour group. */
const BRAND_BASE_BY_GROUP: Readonly<Record<string, string>> = {
    surface: "Surface",
    text: "Text",
    border: "Border",
    "action.primary": "Primary",
    "action.secondary": "Secondary",
    "feedback.info": "Info",
    "feedback.success": "Success",
    "feedback.warning": "Warning",
    "feedback.danger": "Danger"
};

/**
 * A colour reduced to a canonical form for de-duplication: hex is expanded and upper-cased so `#fff`,
 * `#ffffff` and `#FFFFFF` collapse to one brand entry; anything else (rgb/hsl/named) is compared as a
 * trimmed lower-cased string.
 */
const normalizeColor = (value: string): string => {
    const trimmed = value.trim();
    const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(trimmed);
    if (!hex) {
        return trimmed.toLowerCase();
    }
    const body = hex[1];
    const full =
        body.length === 3
            ? body
                  .split("")
                  .map(char => char + char)
                  .join("")
            : body;
    return `#${full.toUpperCase()}`;
};

/** A name for the brand colour a slot introduces — the group's base, qualified once it is taken. */
const brandNameForSlot = (path: string, usedBaseNames: Set<string>): string => {
    const slot = COLOR_SLOT_BY_PATH.get(path);
    const base = slot ? (BRAND_BASE_BY_GROUP[slot.group] ?? slot.groupLabel) : "Colour";
    if (!usedBaseNames.has(base)) {
        usedBaseNames.add(base);
        return base;
    }
    // A second distinct colour in the same group (e.g. a raised surface unlike the page) is qualified
    // by the slot's own label so the palette reads rather than collides.
    return slot ? `${base} ${slot.label}` : base;
};

const slugify = (name: string): string =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "color";

/**
 * Rebinds the extracted colours onto the brand palette — see the design brief's "link-first" colour
 * model. The model returns a literal per slot; a hand-made theme instead points every slot at a brand
 * primitive, so editing one brand colour cascades everywhere it is used. This reproduces that: each
 * distinct extracted colour becomes one brand entry (named after the slot that first uses it), and the
 * slot is pointed at it rather than holding the literal. Colours equal to an existing primitive reuse
 * it instead of spawning a duplicate.
 */
const linkColorsToBrand = (
    document: TokenDocument,
    colors: ColorLink[]
): {
    document: TokenDocument;
    applied: string[];
    failed: Array<{ path: string; reason: string }>;
} => {
    let next = document;
    const applied: string[] = [];
    const failed: Array<{ path: string; reason: string }> = [];

    // Seed the de-dup map from the default palette so an extracted colour that equals a shipped
    // primitive (white, say) links to it instead of creating a near-duplicate.
    const byColor = new Map<string, string>();
    const takenKeys = new Set<string>();
    const brandGroup = getNodeAtPath(next, "color.brand");
    if (isTokenGroup(brandGroup)) {
        for (const name of childNames(brandGroup)) {
            takenKeys.add(name);
            const child: unknown = brandGroup[name];
            if (isDesignToken(child) && typeof child.$value === "string") {
                byColor.set(normalizeColor(child.$value), name);
            }
        }
    }

    const usedBaseNames = new Set<string>();

    // Introduce colours light-first, then in canonical slot order, so the palette's names come from the
    // light theme and are stable run to run rather than dependent on the model's ordering.
    const ordered = [...colors].sort((a, b) => {
        if (a.mode !== b.mode) {
            return a.mode === "light" ? -1 : 1;
        }
        return (
            (COLOR_SLOT_ORDER.get(a.path) ?? Infinity) - (COLOR_SLOT_ORDER.get(b.path) ?? Infinity)
        );
    });

    for (const link of ordered) {
        try {
            const normalized = normalizeColor(link.value);
            let key = byColor.get(normalized);
            if (!key) {
                const name = brandNameForSlot(link.path, usedBaseNames);
                key = slugify(name);
                for (let suffix = 2; takenKeys.has(key); suffix++) {
                    key = `${slugify(name)}-${suffix}`;
                }
                takenKeys.add(key);
                next = setNodeAtPath(next, `color.brand.${key}`, {
                    $type: "color",
                    $value: link.value,
                    $extensions: { [META_EXTENSION]: { key, displayName: name } }
                });
                byColor.set(normalized, key);
            }
            next = setTokenReference(next, link.path, link.mode, `color.brand.${key}`);
            applied.push(link.mode === "dark" ? `${link.path} (dark)` : link.path);
        } catch (error) {
            failed.push({
                path: link.path,
                reason: error instanceof Error ? error.message : String(error)
            });
        }
    }

    return { document: next, applied, failed };
};

/** Every `color.brand.*` primitive some token still points at, in light or dark. */
const referencedBrandColors = (document: TokenDocument): Set<string> => {
    const referenced = new Set<string>();
    for (const { token } of walkTokens(document)) {
        const light = parseAlias(token.$value);
        if (light?.startsWith("color.brand.")) {
            referenced.add(light);
        }
        const dark = parseAlias(token.$extensions?.[MODES_EXTENSION]?.dark);
        if (dark?.startsWith("color.brand.")) {
            referenced.add(dark);
        }
    }
    return referenced;
};

/**
 * Drops brand primitives nothing points at any more.
 *
 * After the extracted colours are linked in, the shipped defaults that every slot used to reference are
 * mostly orphaned. Removing them leaves a palette of exactly the colours the theme renders with —
 * which is what makes a generated palette read as "this site's colours" rather than Webiny's defaults
 * with a few extras bolted on.
 */
const pruneUnreferencedBrandColors = (document: TokenDocument): TokenDocument => {
    const brandGroup = getNodeAtPath(document, "color.brand");
    if (!isTokenGroup(brandGroup)) {
        return document;
    }

    const referenced = referencedBrandColors(document);
    let next = document;
    for (const name of childNames(brandGroup)) {
        if (!referenced.has(`color.brand.${name}`)) {
            next = removeNodeAtPath(next, `color.brand.${name}`);
        }
    }
    return next;
};

/**
 * Applies a validated assignment, starting from the default theme.
 *
 * Non-colour scalars (ramps, shadows) first, then roles — a role's size snaps to the text ramp, so the
 * ramp must hold the model's sizes before the roles are read. Colours come last and take a different
 * path: rather than a literal per slot, each distinct colour becomes a brand primitive and the slot is
 * pointed at it (see `linkColorsToBrand`), so a generated theme has the same editable, link-first
 * palette a hand-made one does. Light precedes dark throughout: a dark value is a mode override, so the
 * token has to hold its light value before the override means anything.
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
    const colors = validated.accepted.filter(entry => entry.type === "color");
    const scalars = validated.accepted.filter(
        entry => entry.type !== "typography" && entry.type !== "color"
    );
    const darkColors = validated.darkAccepted.filter(entry => entry.type === "color");
    const darkScalars = validated.darkAccepted.filter(entry => entry.type !== "color");

    for (const entry of scalars) {
        attempt(entry, () => applyScalar(document, entry, "light"), "light");
    }

    for (const entry of darkScalars) {
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

    const colorLinks: ColorLink[] = [
        ...colors.map(entry => ({
            path: entry.path,
            mode: "light" as const,
            value: entry.value as string
        })),
        ...darkColors.map(entry => ({
            path: entry.path,
            mode: "dark" as const,
            value: entry.value as string
        }))
    ];
    const linked = linkColorsToBrand(document, colorLinks);
    applied.push(...linked.applied);
    failed.push(...linked.failed);
    // Only reshape the palette when colours were actually extracted; a colour-free extraction leaves
    // the shipped primitives untouched rather than stripping the ones its default slots do not use.
    document =
        colorLinks.length > 0 ? pruneUnreferencedBrandColors(linked.document) : linked.document;

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
