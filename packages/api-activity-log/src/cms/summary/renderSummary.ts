import { readablePath } from "@webiny/common-activity-log";
import type { SummaryValueEntry } from "~/core/types.js";

export interface RenderSummaryOptions {
    /** Values no longer than this are quoted. Longer ones are characterised instead. */
    quotedValueMaxLength: number;
    /** How many fields the sentence names before it starts counting the rest. */
    maxNamedFields: number;
}

/**
 * A short value, flattened for prose.
 *
 * Newlines and runs of whitespace collapse, because a quoted value goes into the middle of a
 * sentence and a line break there would break the row. Only the types a reader can take in at a
 * glance are quotable: a string, a number, a boolean. An object or a list is quoted by nobody —
 * `{"_id":"a1b2","heading":"…"}` in the middle of a sentence is worse than saying nothing.
 */
const quotable = (value: unknown, max: number): string | null => {
    if (typeof value === "boolean") {
        // Yes and no, because this is editorial prose and `true` is a programmer's word.
        return value ? "Yes" : "No";
    }

    if (typeof value === "number") {
        return String(value);
    }

    if (typeof value !== "string") {
        return null;
    }

    const flattened = value.replace(/\s+/g, " ").trim();

    return flattened.length === 0 || flattened.length > max ? null : flattened;
};

/** Whether a value counts as absent, which reads as filling in or clearing rather than changing. */
const isEmpty = (value: unknown): boolean => {
    if (value === undefined || value === null) {
        return true;
    }

    if (typeof value === "string") {
        return value.trim() === "";
    }

    return Array.isArray(value) && value.length === 0;
};

/** How long a value is, for deciding between rewrote, expanded and shortened. */
const lengthOf = (value: unknown): number => {
    if (typeof value === "string") {
        return value.length;
    }

    try {
        return JSON.stringify(value)?.length ?? 0;
    } catch {
        return 0;
    }
};

/**
 * One changed field, as a phrase.
 *
 * Quoting is what makes this worth having: "changed On sale from Yes to No" saves a reader the trip
 * to version compare that "edited On sale" does not. Where the value is too long to quote, the
 * phrase characterises the change the same way the model is instructed to — and for the same
 * reason, which is that a timeline row holding a paragraph is a timeline nobody can read.
 */
const describeEntry = (entry: SummaryValueEntry, options: RenderSummaryOptions): Phrase => {
    const name = readablePath(entry.path, entry.label);
    const before = quotable(entry.before, options.quotedValueMaxLength);
    const after = quotable(entry.after, options.quotedValueMaxLength);

    if (isEmpty(entry.before) && !isEmpty(entry.after)) {
        return after === null
            ? { verb: "filled in", tail: name }
            : { verb: "set", tail: `${name} to ${after}` };
    }

    if (!isEmpty(entry.before) && isEmpty(entry.after)) {
        return { verb: "cleared", tail: name };
    }

    if (before !== null && after !== null) {
        return { verb: "changed", tail: `${name} from ${before} to ${after}` };
    }

    // At least one side is too long, or is not the sort of value a sentence can hold. Say what
    // happened to it by size, which is the honest thing derivable without quoting it.
    const grew = lengthOf(entry.after) - lengthOf(entry.before);
    const scale = Math.max(lengthOf(entry.before), 1);

    if (grew / scale > 0.25) {
        return { verb: "expanded", tail: name };
    }

    if (-grew / scale > 0.25) {
        return { verb: "shortened", tail: name };
    }

    return { verb: "rewrote", tail: name };
};

/**
 * One field's phrase, split so that a run of them can share a verb.
 *
 * "Changed Name from Widget to Gadget and changed On sale from Yes to No" is what the obvious
 * implementation produces and it reads like a machine wrote it, which — while true — is not a
 * reason to sound like one.
 */
interface Phrase {
    verb: string;
    tail: string;
}

/** `a`, `a and b`, `a, b and c` — with a repeated verb said once. */
const join = (phrases: Phrase[]): string => {
    const rendered = phrases.map((phrase, index) =>
        index > 0 && phrases[index - 1]!.verb === phrase.verb
            ? phrase.tail
            : `${phrase.verb} ${phrase.tail}`
    );

    if (rendered.length <= 1) {
        return rendered[0] ?? "";
    }

    return `${rendered.slice(0, -1).join(", ")} and ${rendered[rendered.length - 1]}`;
};

/**
 * The summary for a save, written from the values rather than by a model.
 *
 * The same sentence the AI path produces, arrived at mechanically: same input bundle, same output
 * field, same place on the record. Only the generator differs.
 *
 * It exists because the overwhelming majority of saves never qualify for a model — two short fields
 * give one nothing to say that the field list does not — and those saves are exactly the ones a
 * mechanical render describes perfectly. It costs no dispatch, no job and no model, so it runs
 * inline in the recorder and the values it reads are never written anywhere.
 *
 * **It quotes short values, and that is a deliberate widening of what a record discloses.** Before
 * this, a save with two short text fields recorded their paths and labels and nothing else. Now it
 * records what they became, permanently, for anyone who may read the timeline. The AI path already
 * quoted; this makes quoting ordinary rather than rare.
 */
export const renderSummary = (
    values: SummaryValueEntry[],
    options: RenderSummaryOptions
): string => {
    const described = values.filter(entry => entry.before !== entry.after);

    if (described.length === 0) {
        return "";
    }

    const named = described
        .slice(0, options.maxNamedFields)
        .map(entry => describeEntry(entry, options));

    const remaining = described.length - named.length;

    const phrases: Phrase[] =
        remaining > 0
            ? [
                  ...named,
                  {
                      // A distinct verb on purpose, so the count never merges into the run above it
                      // and reads as another named field.
                      verb: "touched",
                      tail: `${remaining} other ${remaining === 1 ? "field" : "fields"}`
                  }
              ]
            : named;

    const sentence = join(phrases);

    return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
};
