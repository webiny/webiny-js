import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ChangesetEntry, SummarySkipReason, SummaryValueEntry } from "~/core/types.js";
import { isFreeTextChange } from "./classifyFreeText.js";
import { bundleByteSize, buildValueBundle, valueAtPath } from "./buildValueBundle.js";
import type { IActivitySummaryConfig } from "./config.js";

export interface RouteSummaryParams {
    model: CmsModel;
    changeset: ChangesetEntry[];
    /** The entry as it was, when the event carries one. */
    before: Record<string, unknown> | undefined;
    after: Record<string, unknown>;
    /** Resolved by `ActivitySourceResolver` — an identity type, `system`, or `task:<id>`. */
    source: string;
    /** False when no model is configured, which is checkable without calling one. */
    aiAvailable: boolean;
    config: IActivitySummaryConfig;
}

export type RouteSummaryDecision =
    /** Worth a model. The values go on the record and a job is dispatched. */
    | { kind: "ai"; values: SummaryValueEntry[] }
    /**
     * Described mechanically, inline, from the values in hand.
     *
     * Carries the reason the model was not used, because "why is there no AI summary here" stays a
     * question worth being able to answer even once there is a sentence on the row.
     */
    | { kind: "deterministic"; values: SummaryValueEntry[]; reason: SummarySkipReason }
    /** No sentence at all: there is nothing a description would add. */
    | { kind: "none"; reason: SummarySkipReason };

/**
 * A write the summary path treats as interactive.
 *
 * `admin` and nothing else. UI and script cannot be told apart — both arrive as manage API
 * mutations carrying a JWT that resolves to the same identity type, no header reaches a use case,
 * and the admin app sets no client marker — so this excludes what it can: API keys, anonymous and
 * system writes, and everything task-performed, which covers bulk operations since CMS bulk actions
 * run as background tasks and carry a `task:` source.
 *
 * What remains is a script holding a person's token. The path cap and the debounce limit that cost
 * rather than preventing it, which is stated in the PR rather than papered over.
 */
const isInteractive = (source: string): boolean => source === "admin";

/**
 * How a save gets described: by a model, mechanically, or not at all.
 *
 * Fixed by construction — the same change always takes the same route, so the timeline does not
 * vary between runs and the decision can be unit-tested without a model, a container or a network.
 *
 * The order is the point. Everything that survives the first two checks is described; the caps
 * below them decide only whether a *model* is worth it. That inversion is deliberate: the caps were
 * written to bound what gets stored on a record and sent to a provider, and a mechanical render
 * does neither — it reads values already in hand and stores one sentence.
 *
 * Every outcome carries a reason, including the ones that are not failures, so "why is there no AI
 * summary on this row" stays answerable after the row has a sentence on it.
 */
export const routeSummary = (params: RouteSummaryParams): RouteSummaryDecision => {
    const { changeset, config } = params;

    // ── Saves that get no sentence at all ────────────────────────────────────────────────────
    //
    // Two cases, and both are about there being nothing to say rather than about cost. Everything
    // else below gets described one way or the other.

    if (!isInteractive(params.source)) {
        // An API key, a system write, a background task. Not editorial work, and the feature
        // describes editorial work.
        return { kind: "none", reason: "not-interactive" };
    }

    // No before means no diff: a publish, a move or a trashing changes no field values.
    if (!params.before || changeset.length === 0) {
        return { kind: "none", reason: "structural-only" };
    }

    if (changeset.every(change => Boolean(change.operation))) {
        // Blocks added, removed or moved. The operation and the block name are the whole
        // description; neither a model nor a renderer improves on "added a Testimonial block".
        return { kind: "none", reason: "structural-only" };
    }

    const values = buildValueBundle({
        changeset,
        before: params.before,
        after: params.after
    });

    // ── Everything past here is described. The only question is by what ──────────────────────
    //
    // Each of these caps was written to bound what gets written to a record and sent to a model.
    // None of them bounds a mechanical render, which stores a sentence and nothing else — so they
    // gate the model, and the save still gets described.

    const deterministic = (reason: SummarySkipReason): RouteSummaryDecision => ({
        kind: "deterministic",
        values,
        reason
    });

    if (!config.enabled) {
        // The switch means "do not send my content to a model", not "do not describe my changes".
        // Nothing leaves the installation on this path.
        return deterministic("disabled");
    }

    if (!params.aiAvailable) {
        return deterministic("ai-unavailable");
    }

    if (changeset.length > config.maxPaths) {
        // Past the cap a model earns nothing over a list, and these are the saves with the largest
        // bundles. The renderer names the first few fields and counts the rest.
        return deterministic("too-many-paths");
    }

    const freeTextPaths = changeset.filter(change =>
        isFreeTextChange({
            model: params.model,
            path: change.path,
            before: valueAtPath(params.before, change.path),
            after: valueAtPath(params.after, change.path),
            minLength: config.freeTextMinLength
        })
    );

    // Two prose fields is a reworked section. One prose field is described well enough by naming
    // it — unless it sits amid a busy save, where a body rewritten while several headings were
    // retouched is exactly the change a sentence captures and a list of field names does not.
    const qualifies =
        freeTextPaths.length >= config.minFreeTextPaths ||
        (freeTextPaths.length === 1 && changeset.length >= config.singleFreeTextMinPaths);

    if (!qualifies) {
        // The commonest outcome by a wide margin, and the one the renderer serves best: a handful
        // of short fields, every one of them quotable.
        return deterministic("too-few-text-fields");
    }

    if (bundleByteSize(values) > config.maxValueBytes) {
        // Too large to put on a record and hand to a model. Not too large to describe: the
        // renderer characterises what it cannot quote, so the sentence stays a sentence.
        return deterministic("values-too-large");
    }

    return { kind: "ai", values };
};
