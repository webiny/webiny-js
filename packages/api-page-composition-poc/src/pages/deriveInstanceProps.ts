import { alignRunsByRole } from "./alignRunsByRole.js";
import type { SectionRun } from "./collectSectionTexts.js";

export interface AlignableProp {
    name: string;
    /** Values observed across the whole cluster. Index 0 is what Assemble would have used. */
    observedValues: string[];
}

/**
 * How much evidence stands behind a derived value. The caller logs everything but `role`.
 *
 * `role` — the instance has a run playing the same part as the run the prop's sample came from.
 *   This is the only one backed by evidence about *this* section.
 * `position` — role alignment found no counterpart, so the run at the same index was taken instead.
 *   A guess: it is right when the two sections happen to line up and wrong when they do not, and
 *   nothing in the value itself says which.
 * `cluster` — no run could be taken at all, so the cluster-wide sample stands. Assemble's behaviour,
 *   and the only one of the three that is openly another page's content.
 */
export type PropSource = "role" | "position" | "cluster";

export interface DerivedProp {
    name: string;
    value: string;
    source: PropSource;
}

const compact = (text: string): string => text.replace(/\s+/g, " ").trim();
const loose = (text: string): string => compact(text).toLowerCase();

/**
 * Where a prop's cluster sample sits among the representative section's texts.
 *
 * Exact first, then case/whitespace-insensitive, then containment in either direction — a prop value
 * is often a trimmed or truncated version of the text run it came from (Plan caps what it shows the
 * model), so requiring equality would align almost nothing.
 */
const locate = (runs: readonly SectionRun[], value: string): number => {
    const target = compact(value);
    if (!target) {
        return -1;
    }

    const exact = runs.findIndex(run => run.text === target);
    if (exact !== -1) {
        return exact;
    }

    const lowered = loose(target);
    const insensitive = runs.findIndex(run => loose(run.text) === lowered);
    if (insensitive !== -1) {
        return insensitive;
    }

    return runs.findIndex(run => {
        const candidate = loose(run.text);
        return candidate.includes(lowered) || lowered.includes(candidate);
    });
};

/**
 * This instance's prop values, derived by aligning its section's runs against the representative's.
 *
 * PROOF OF CONCEPT, and still the most approximate thing this package does. Plan's props are
 * model-proposed, so nothing records which text run a given prop came from; the representative's
 * sample value is the only link back, and everything here reconstructs that link rather than reading
 * it. The fix for that lives in Plan, not here.
 *
 * Runs are matched BY ROLE — see `alignRunsByRole` — which survives a section gaining or losing runs
 * between pages. An earlier version matched by index alone, and measured across four sites it bound
 * 52 of 296 props to a different slot's text on 24 of 31 pages: a contact form's "required field"
 * note showing the privacy sentence, a gallery heading showing the page title. Those are values that
 * are real text from the right page, so no downstream check can tell them from correct ones. Index
 * matching survives only as the fallback below, where role alignment has nothing to offer.
 *
 * Every value that is not `role` is reported by the caller. That matters more than it sounds: the
 * comment this one replaces promised "the caller logs every fallback", nothing read `source`, and
 * the promise read as coverage for four months. A mitigation described and not wired is worse than
 * none. Whatever else changes here, `source` must keep a consumer — see `composePage`.
 *
 * Only scalar TEXT props are derived here, because text is the only thing this alignment can speak
 * about: it matches a prop's sample against the section's text runs. An image has no place in that
 * sequence, and routing a text run into an image input would be worse than leaving it empty. Images
 * and links are bound from the captured tree by `deriveCompositeInputs`, which can see them.
 */
export const deriveInstanceProps = (params: {
    props: AlignableProp[];
    representativeRuns: SectionRun[];
    instanceRuns: SectionRun[];
}): DerivedProp[] => {
    const { props, representativeRuns, instanceRuns } = params;
    const byRole = alignRunsByRole(representativeRuns, instanceRuns);

    // Instance runs, not representative ones: the run is the resource, and one run backs at most one
    // prop so that two props sharing a sample do not collapse onto the same copy.
    const taken = new Set<number>();

    const claim = (at: number): string | null => {
        if (at < 0 || taken.has(at)) {
            return null;
        }
        const text = compact(instanceRuns[at]?.text ?? "");
        if (!text) {
            return null;
        }
        taken.add(at);
        return text;
    };

    return props.map(prop => {
        const sample = prop.observedValues[0] ?? "";
        const index = locate(representativeRuns, sample);
        if (index === -1) {
            return { name: prop.name, value: sample, source: "cluster" as const };
        }

        const byRoleValue = claim(byRole[index] ?? -1);
        if (byRoleValue !== null) {
            return { name: prop.name, value: byRoleValue, source: "role" as const };
        }

        const byPositionValue = claim(index);
        if (byPositionValue !== null) {
            return { name: prop.name, value: byPositionValue, source: "position" as const };
        }

        return { name: prop.name, value: sample, source: "cluster" as const };
    });
};
