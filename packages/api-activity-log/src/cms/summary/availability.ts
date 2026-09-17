import { createAbstraction } from "@webiny/feature/api";

/**
 * Whether a model can be reached at all.
 *
 * An abstraction rather than a direct call into AI Power-Ups so that the routing rule stays
 * testable without it, and so this package does not depend on the extension in order to decide not
 * to use it. The real implementation resolves the summary capability, which returns a failed
 * `Result` rather than throwing when nothing is configured.
 *
 * Answering false is not an error state: an installation entitled to the activity log but not to
 * AI, or one that has simply not configured a provider, gets the timeline with deterministic
 * descriptions and no sentences.
 */
export interface ISummaryModelAvailability {
    isAvailable(): boolean;
}

export const SummaryModelAvailability = createAbstraction<ISummaryModelAvailability>(
    "ActivityLog/SummaryModelAvailability"
);

export namespace SummaryModelAvailability {
    export type Interface = ISummaryModelAvailability;
}

/** Stands in until the capability is registered, in the checkpoint that adds the job. */
class UnavailableSummaryModelImpl implements ISummaryModelAvailability {
    isAvailable(): boolean {
        return false;
    }
}

export const UnavailableSummaryModel = SummaryModelAvailability.createImplementation({
    implementation: UnavailableSummaryModelImpl,
    dependencies: []
});
