export interface AlignableProp {
    name: string;
    /** Values observed across the whole cluster. Index 0 is what Assemble would have used. */
    observedValues: string[];
}

export interface DerivedProp {
    name: string;
    value: string;
    /**
     * `instance` — read from this page's own captured section.
     * `cluster` — the prop could not be located in the representative, or this section has no text
     *   in that position, so the cluster-wide sample stands. Every one of these is a discard-log
     *   entry: it is a place where one page is showing another page's content.
     */
    source: "instance" | "cluster";
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
const locate = (texts: string[], value: string): number => {
    const target = compact(value);
    if (!target) {
        return -1;
    }

    const exact = texts.indexOf(target);
    if (exact !== -1) {
        return exact;
    }

    const lowered = loose(target);
    const insensitive = texts.findIndex(text => loose(text) === lowered);
    if (insensitive !== -1) {
        return insensitive;
    }

    return texts.findIndex(text => {
        const candidate = loose(text);
        return candidate.includes(lowered) || lowered.includes(candidate);
    });
};

/**
 * This instance's prop values, derived by aligning its section's text runs against the cluster
 * representative's.
 *
 * PROOF OF CONCEPT, and the single most approximate thing this package does. Plan's props are
 * model-proposed, so nothing records which text run a given prop came from; the representative's
 * sample value is the only link back. Aligning by position is deterministic and explainable, and it
 * degrades to Assemble's current behaviour (the cluster sample) rather than to an empty page — but a
 * section whose text runs differ in number or order between pages will mis-align, and the caller
 * logs every fallback so the demo never silently claims per-page fidelity it does not have.
 *
 * Only scalar text props are derived. Images, links and anything composite are not addressed here:
 * the captured tree Segment forwards carries text and geometry but no element attributes, so an
 * `href` or `src` simply is not in it (`CapturedNode`). Those stay on the cluster sample.
 */
export const deriveInstanceProps = (params: {
    props: AlignableProp[];
    representativeTexts: string[];
    instanceTexts: string[];
}): DerivedProp[] => {
    const { props, representativeTexts, instanceTexts } = params;
    const taken = new Set<number>();

    return props.map(prop => {
        const sample = prop.observedValues[0] ?? "";
        const index = locate(representativeTexts, sample);

        // One text run backs at most one prop, so two props sharing a sample don't collapse onto it.
        if (index === -1 || taken.has(index)) {
            return { name: prop.name, value: sample, source: "cluster" as const };
        }

        const derived = instanceTexts[index];
        if (derived === undefined || !compact(derived)) {
            return { name: prop.name, value: sample, source: "cluster" as const };
        }

        taken.add(index);
        return { name: prop.name, value: compact(derived), source: "instance" as const };
    });
};
