import type { ComposedPageDto, PageSignalsDto } from "~/shared/types.js";

export type ComposedStatus = "composed" | "caveat" | "failed" | "unknown";

/** Each status as the tag a page row shows. */
export const STATUS_TAG: Record<ComposedStatus, { content: string; variant: string }> = {
    composed: { content: "composed", variant: "success-light" },
    caveat: { content: "composed, with a caveat", variant: "warning" },
    failed: { content: "failed", variant: "destructive" },
    unknown: { content: "composed, unmeasured", variant: "neutral-light" }
};

/** Below this share of the source's text runs, a page is worth looking at rather than trusting. */
const TEXT_COVERAGE_CAVEAT = 0.9;

export const textCoverage = (signals: PageSignalsDto): number | null => {
    if (signals.textTotal === 0) {
        return null;
    }
    return signals.textPresent / signals.textTotal;
};

/**
 * One page's status, derived from its signals rather than stored.
 *
 * Derived because the rule is a judgement about the signals, and storing it would freeze that
 * judgement into every page map ever written — so a change to what counts as a caveat would have to
 * re-compose four sites to take effect. The signals are the facts; this is the reading of them, and
 * the reading belongs where it can change.
 *
 * "Caveat" is deliberately not "failed": the page exists and is published. It means something is
 * missing from it that an operator should see before trusting it.
 */
export const composedStatus = (page: ComposedPageDto): ComposedStatus => {
    const signals = page.signals;
    if (!signals) {
        // Composed before the signals shipped. Saying "composed" would claim a check that never ran.
        return "unknown";
    }

    const coverage = textCoverage(signals);
    const caveat =
        signals.unplaced.length > 0 ||
        signals.composedInstances < signals.sourceSections ||
        signals.links.dropped > signals.links.recovered ||
        (coverage !== null && coverage < TEXT_COVERAGE_CAVEAT);

    return caveat ? "caveat" : "composed";
};

/** Why a page carries a caveat, in the order an operator would want to read it. */
export const caveatReasons = (signals: PageSignalsDto): string[] => {
    const reasons: string[] = [];
    if (signals.unplaced.length > 0) {
        reasons.push(
            `${signals.unplaced.length} section${signals.unplaced.length === 1 ? "" : "s"} had no promoted component and is absent from the page`
        );
    }
    if (signals.composedInstances < signals.sourceSections) {
        reasons.push(
            `${signals.sourceSections} sections in the source against ${signals.composedInstances} composed`
        );
    }
    const coverage = textCoverage(signals);
    if (coverage !== null && coverage < TEXT_COVERAGE_CAVEAT) {
        reasons.push(
            `${signals.textPresent} of ${signals.textTotal} source text runs found on the composed page`
        );
    }
    const unrecovered = signals.links.dropped - signals.links.recovered;
    if (unrecovered > 0) {
        reasons.push(
            `${unrecovered} invented destination${unrecovered === 1 ? "" : "s"} left empty rather than pointed somewhere plausible and wrong`
        );
    }
    return reasons;
};
