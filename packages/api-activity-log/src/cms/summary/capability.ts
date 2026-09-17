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
 */
const guidance = `You are describing what a content editor just changed, for a colleague reading an activity timeline.

You will be given a list of changed fields. Each one has a readable name, the value before the change, and the value after it.

Write one or two short sentences, in plain editorial English, saying what changed. Write as if continuing the sentence "In this save, the editor…" but do not include that phrase.

Rules:

- Be specific. Name the fields that changed, using the readable names given.
- Quote short values directly where it helps — "renamed the pricing tier from Starter to Essential" is far more useful than "changed the pricing tier".
- Do NOT reproduce long values. For anything longer than a phrase, characterise it instead: "rewrote the introduction", "shortened the product description", "replaced the closing paragraph".
- Say what changed, not whether it was an improvement. No praise, no judgement, no advice.
- Do not speculate about intent or about anything outside the fields you were given.
- Do not use bullet points, headings, markdown, or quotation marks around the whole response.
- Two sentences maximum. One is usually better.

If the changes are too disparate to summarise in two sentences, describe the largest one and say that other fields also changed.`;

class ActivityLogSummaryCapabilityImpl implements AiCapability.Interface {
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
