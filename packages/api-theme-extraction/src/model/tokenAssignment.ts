import { z } from "zod";
import { getCanonicalSlot, isCanonicalPath } from "@webiny/theme-common";

/**
 * The contract the model answers with — see the design brief, section 10.5.
 *
 * The model assigns values to canonical slots. It does NOT return a token document, and that is the
 * central decision here: a free-form DTCG document lets the model invent structure, and we would then
 * have to validate a tree we did not design against a schema it half-followed. A flat map from
 * canonical path to value can only be right or wrong per entry, and wrong is mechanically detectable.
 *
 * Partial answers are expected and fine. `CreateThemeUseCase` seeds every slot from the default theme,
 * so an unassigned slot is a sensible default rather than a hole — which means the model can decline to
 * guess, and say so in `uncertain`, instead of inventing a colour to fill a field.
 */

const typographyValueSchema = z
    .object({
        fontFamily: z.string().optional(),
        fontSize: z.string().optional(),
        fontWeight: z.union([z.string(), z.number()]).optional(),
        lineHeight: z.union([z.string(), z.number()]).optional(),
        letterSpacing: z.string().optional()
    })
    .strict();

export type ModelTypographyValue = z.infer<typeof typographyValueSchema>;

const uncertaintySchema = z.object({
    path: z.string(),
    /** Shown to the user in the review banner, so it must be a sentence, not a code. */
    reason: z.string()
});

/**
 * Uncertainty is a required part of the answer, not an optional extra.
 *
 * A model asked for tokens will always produce tokens; asked to also record what it was unsure of, it
 * distinguishes "the action colour is unmistakably this blue" from "I picked the least-bad of four
 * greys". The user reviewing a generated theme needs that difference, and it is the only honest input
 * to the review banner.
 */
export const modelAssignmentSchema = z.object({
    tokens: z.record(z.string(), z.union([z.string(), typographyValueSchema])),
    /** Dark-mode colour values, for the slots that differ. */
    darkTokens: z.record(z.string(), z.string()).optional(),
    uncertain: z.array(uncertaintySchema),
    /** One or two sentences for the review banner. */
    summary: z.string(),
    confidence: z.enum(["high", "medium", "low"])
});

export type ModelAssignment = z.infer<typeof modelAssignmentSchema>;

export type AssignmentValue = string | ModelTypographyValue;

export interface AcceptedAssignment {
    path: string;
    value: AssignmentValue;
    type: string;
}

export interface RejectedAssignment {
    path: string;
    value: unknown;
    reason: string;
}

export interface ValidatedAssignment {
    accepted: AcceptedAssignment[];
    rejected: RejectedAssignment[];
    darkAccepted: AcceptedAssignment[];
    darkRejected: RejectedAssignment[];
}

const TYPOGRAPHY_TYPE = "typography";

const describeShape = (value: unknown): string => {
    if (typeof value === "string") {
        return "a string";
    }
    if (value && typeof value === "object") {
        return "an object";
    }
    return typeof value;
};

const checkEntry = (path: string, value: unknown): RejectedAssignment | AcceptedAssignment => {
    if (!isCanonicalPath(path)) {
        return {
            path,
            value,
            reason: `"${path}" is not a canonical token slot, so there is nowhere to put this value.`
        };
    }

    // Non-null asserted safely: `isCanonicalPath` passing means the slot exists.
    const slot = getCanonicalSlot(path)!;

    // Typography slots take the composite object; everything else takes a scalar. Getting this
    // backwards is the model's most likely structural mistake, so it is checked rather than coerced.
    if (slot.type === TYPOGRAPHY_TYPE) {
        if (typeof value !== "object" || value === null) {
            return {
                path,
                value,
                reason: `"${path}" is a typography slot and needs an object of font properties, but got ${describeShape(value)}.`
            };
        }
        return { path, value: value as ModelTypographyValue, type: slot.type };
    }

    if (typeof value !== "string" || value.trim() === "") {
        return {
            path,
            value,
            reason: `"${path}" is a ${slot.type} slot and needs a non-empty string value, but got ${describeShape(value)}.`
        };
    }

    return { path, value, type: slot.type };
};

const isRejected = (
    entry: RejectedAssignment | AcceptedAssignment
): entry is RejectedAssignment => {
    return "reason" in entry;
};

/**
 * Sorts the model's answer into what we can use and what we cannot.
 *
 * Deliberately partial rather than all-or-nothing. One hallucinated path should not cost the user the
 * sixty correct ones — and because unassigned slots fall back to defaults, dropping a bad entry
 * degrades the theme by exactly that one slot. Rejections are returned rather than logged so the task
 * can record them on the theme, where someone reviewing it can actually see them.
 */
export const validateAssignment = (assignment: ModelAssignment): ValidatedAssignment => {
    const accepted: AcceptedAssignment[] = [];
    const rejected: RejectedAssignment[] = [];
    const darkAccepted: AcceptedAssignment[] = [];
    const darkRejected: RejectedAssignment[] = [];

    for (const [path, value] of Object.entries(assignment.tokens)) {
        const entry = checkEntry(path, value);
        if (isRejected(entry)) {
            rejected.push(entry);
        } else {
            accepted.push(entry);
        }
    }

    for (const [path, value] of Object.entries(assignment.darkTokens ?? {})) {
        const entry = checkEntry(path, value);
        if (isRejected(entry)) {
            darkRejected.push(entry);
            continue;
        }

        // Only colour and shadow vary by mode. A dark-mode font size is a category error, and silently
        // storing one would produce a theme whose dark variant reflows.
        if (entry.type !== "color" && entry.type !== "shadow") {
            darkRejected.push({
                path,
                value,
                reason: `"${path}" is a ${entry.type} slot, which does not vary between light and dark.`
            });
            continue;
        }

        darkAccepted.push(entry);
    }

    return { accepted, rejected, darkAccepted, darkRejected };
};

/**
 * Whether the answer is worth building a theme from.
 *
 * A model that assigned almost nothing has not understood the site, and a theme that is 95% defaults
 * is worse than an error: it looks like a result. The threshold is low on purpose — the goal is to
 * catch a failed answer, not to insist on a complete one.
 */
export const MIN_ACCEPTED_ASSIGNMENTS = 8;

export const isUsableAssignment = (validated: ValidatedAssignment): boolean => {
    return validated.accepted.length >= MIN_ACCEPTED_ASSIGNMENTS;
};
