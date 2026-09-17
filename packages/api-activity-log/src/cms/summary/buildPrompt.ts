import { readablePath } from "@webiny/common-activity-log";
import type { SummaryValueEntry } from "~/core/types.js";

/**
 * How much of a single value reaches the model.
 *
 * Long values are what the prompt asks the model to characterise rather than reproduce, and there
 * is no reason to pay to send the whole of one it has been told not to quote. Cutting here also
 * bounds a single enormous field's effect on the request, which the bundle ceiling does not: the
 * ceiling governs the bundle, not any one entry within it.
 */
const MAX_VALUE_CHARS = 2000;

const render = (value: unknown): string => {
    if (value === undefined || value === null) {
        return "(empty)";
    }

    const text = typeof value === "string" ? value : safeStringify(value);

    if (text.length <= MAX_VALUE_CHARS) {
        return text;
    }

    return `${text.slice(0, MAX_VALUE_CHARS)}… (truncated, ${text.length} characters in total)`;
};

const safeStringify = (value: unknown): string => {
    try {
        return JSON.stringify(value) ?? String(value);
    } catch {
        return "(unreadable)";
    }
};

/**
 * The user half of the request: the changed fields, named the way the timeline names them.
 *
 * Field names come from `readablePath`, which is shared with the admin side, so the model describes
 * "Page body › Testimonials › Heading" rather than `pageBody.testimonials#a1b2c3.heading`. A model
 * given path expressions writes about path expressions.
 *
 * The truncation marker is stated rather than silent. A model handed a value cut off mid-sentence
 * with no indication would describe the fragment as though it were the whole change.
 */
export const buildSummaryPrompt = (values: SummaryValueEntry[]): string => {
    const fields = values
        .map(entry => {
            const name = readablePath(entry.path, entry.label);

            return [
                `Field: ${name}`,
                `Before: ${render(entry.before)}`,
                `After: ${render(entry.after)}`
            ].join("\n");
        })
        .join("\n\n");

    return `CHANGED FIELDS\n\n${fields}`;
};
