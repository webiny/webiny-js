import { AiCapability } from "@webiny/ai-powerups/api/features/Capabilities/index.js";

export const ACTIVITY_LOG_SUMMARY_CAPABILITY = "cms.activityLogSummary";

/**
 * The output contract. The use case takes the response as prose verbatim, so the only structure
 * asked for is brevity — anything else the model volunteers ends up on a timeline row.
 *
 * The instruction about values is the delicate part and it is deliberately two-sided. Quoting a
 * short value is what makes a summary worth having: "renamed the tier from Starter to Essential"
 * removes the need to compare, where "changed the tier name" does not. Reproducing a long value is
 * the opposite — it turns a one-line row into a wall of content, and the record keeps it forever.
 *
 * Three of the rules below were written against observed output rather than imagined output, which
 * is why they are as specific as they are. A model asked to describe a price change from 1199 to
 * 1200 rendered it "$1,199 to $1,200" — a currency and a separator that were in no captured value —
 * directly above a mechanical sentence reading "changed Price from 1999 to 1199". It wrote
 * "increased the price to 1999" elsewhere, giving one side where the sentence beneath gave two. And
 * it called a description "detailed" and its replacement "generic", which are verdicts rather than
 * changes.
 *
 * The judgement rule was already there and was ignored, so it now carries the failing sentence
 * beside the passing one. A prohibition states a boundary; an example shows where it runs.
 */
const guidance = `You are describing what a content editor just changed, for a colleague reading an activity timeline.

Your sentence does not stand alone. Directly above and below it are sentences about neighbouring saves, built mechanically from the recorded values, which quote those values exactly as they were captured. Anything you render differently — a number formatted another way, a value given on one side only — reads to that colleague as the timeline disagreeing with itself rather than as a difference of style.

You will be given a list of changed fields. Each one has a readable name, the value before the change, and the value after it.

Write one or two short sentences, in plain editorial English, saying what changed. Write as if continuing the sentence "In this save, the editor…" but do not include that phrase.

Rules:

- Be specific. Name the fields that changed, using the readable names given.
- Quote short values directly where it helps — "renamed the pricing tier from Starter to Essential" is far more useful than "changed the pricing tier".
- Quote them exactly as they were given to you. Add no currency symbols, no thousands separators, no units, no other formatting. A price captured as 1199 is "1199" — never "$1,199".
- Where you quote a short value, give both sides. "changed the price from 1199 to 1200", not "increased the price to 1200": the sentence beside yours always gives both, and half a comparison reads as a different account of the same change.
- Do NOT reproduce long values. For anything longer than a phrase, characterise it instead: "rewrote the introduction", "shortened the product description", "replaced the closing paragraph".
- Say what changed, not whether it was an improvement. No praise, no judgement, no advice.
  - Wrong: "replaced the detailed product description with a generic statement" — "detailed" and "generic" are verdicts on the content, and neither is in the values you were given.
  - Right: "rewrote the product description".
- Do not speculate about intent or about anything outside the fields you were given.
- Do not use bullet points, headings, markdown, or quotation marks around the whole response.
- Two sentences maximum. One is usually better.

If the changes are too disparate to summarise in two sentences, describe the largest one and say that other fields also changed.`;

export class ActivityLogSummaryCapabilityImpl implements AiCapability.Interface {
    readonly id = ACTIVITY_LOG_SUMMARY_CAPABILITY;
    readonly label = "Activity log summaries";
    readonly description =
        "Describes what changed in a content entry save, for the activity timeline. Short, frequent work that a smaller model handles well.";
    /**
     * `fast` because this runs per save on an editor's ordinary work, and the output is two
     * sentences. An unfilled `fast` role falls back to `standard`, so a project that has not
     * thought about roles still gets whatever it configured.
     */
    readonly defaultRole = "fast" as const;
    readonly guidance = guidance;
}

export const ActivityLogSummaryCapability = AiCapability.createImplementation({
    implementation: ActivityLogSummaryCapabilityImpl,
    dependencies: []
});
