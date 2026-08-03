import {
    createDefaultThemeDocument,
    setTokenValue,
    setTypographySubProperty,
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

export interface AppliedAssignment {
    document: TokenDocument;
    /** Paths actually written, for the theme's metadata. */
    applied: string[];
    /**
     * Paths the model assigned and validation accepted, but which could not be written.
     *
     * Should be empty: validation already checked the path is canonical and the shape matches. Anything
     * here means the document and the canonical list disagree, which is worth surfacing rather than
     * swallowing.
     */
    failed: Array<{ path: string; reason: string }>;
}

const applyTypography = (
    document: TokenDocument,
    path: string,
    value: ModelTypographyValue
): TokenDocument => {
    let next = document;

    for (const property of TYPOGRAPHY_SUB_PROPERTIES) {
        const subValue = value[property as TypographySubProperty];
        if (subValue === undefined) {
            continue;
        }

        // Weights and line heights arrive as either a number or a string depending on how the model
        // phrased them; both are valid DTCG values, so neither is coerced.
        next = setTypographySubProperty(next, path, property, subValue);
    }

    return next;
};

const applyOne = (
    document: TokenDocument,
    entry: AcceptedAssignment,
    mode: "light" | "dark"
): TokenDocument => {
    if (entry.type === "typography") {
        return applyTypography(document, entry.path, entry.value as ModelTypographyValue);
    }

    return setTokenValue(document, entry.path, mode, entry.value as string);
};

/**
 * Applies a validated assignment, starting from the default theme.
 *
 * Light values first, then dark: a dark value is stored as a mode override on the token, so the token
 * has to hold its light value before the override means anything.
 */
export const applyAssignment = (validated: ValidatedAssignment): AppliedAssignment => {
    let document = createDefaultThemeDocument();
    const applied: string[] = [];
    const failed: Array<{ path: string; reason: string }> = [];

    const attempt = (entry: AcceptedAssignment, mode: "light" | "dark") => {
        try {
            document = applyOne(document, entry, mode);
            applied.push(mode === "dark" ? `${entry.path} (dark)` : entry.path);
        } catch (error) {
            // One slot the document will not accept must not lose the rest of the theme.
            failed.push({
                path: entry.path,
                reason: error instanceof Error ? error.message : String(error)
            });
        }
    };

    for (const entry of validated.accepted) {
        attempt(entry, "light");
    }

    for (const entry of validated.darkAccepted) {
        attempt(entry, "dark");
    }

    return { document, applied, failed };
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
