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
    | { dispatch: true; values: SummaryValueEntry[] }
    | { dispatch: false; reason: SummarySkipReason };

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
 * Whether a save gets a generated sentence, and if not, why.
 *
 * Deterministic by construction: the same change always takes the same route, so the timeline does
 * not vary between runs and the decision can be unit-tested without a model, a container or a
 * network.
 *
 * Every outcome carries a reason, including the ones that are not failures. "No summary" is the
 * overwhelmingly common case and the reasons exist so the cost model can be judged against what
 * actually happened rather than argued about.
 */
export const routeSummary = (params: RouteSummaryParams): RouteSummaryDecision => {
    const { changeset, config } = params;

    if (!config.enabled) {
        return { dispatch: false, reason: "disabled" };
    }

    if (!isInteractive(params.source)) {
        return { dispatch: false, reason: "not-interactive" };
    }

    if (!params.aiAvailable) {
        return { dispatch: false, reason: "ai-unavailable" };
    }

    // No before means no diff: a publish, a move or a trashing changes no field values, and there
    // is nothing for a model to describe that the action name does not already say.
    if (!params.before || changeset.length === 0) {
        return { dispatch: false, reason: "structural-only" };
    }

    // Past the cap a sentence adds nothing over a count, and these are the saves with the largest
    // bundles — the two reasons point the same way.
    if (changeset.length > config.maxPaths) {
        return { dispatch: false, reason: "too-many-paths" };
    }

    if (changeset.every(change => Boolean(change.operation))) {
        // Blocks added, removed or moved. The operation and the block name are the whole
        // description; no model improves on "added a Testimonial block".
        return { dispatch: false, reason: "structural-only" };
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

    // One prose field changing is already described by naming it. Two or more is where a sentence
    // starts saying something a list of field names does not.
    if (freeTextPaths.length < 2) {
        return { dispatch: false, reason: "too-few-text-fields" };
    }

    const values = buildValueBundle({
        changeset,
        before: params.before,
        after: params.after
    });

    if (bundleByteSize(values) > config.maxValueBytes) {
        return { dispatch: false, reason: "values-too-large" };
    }

    return { dispatch: true, values };
};
