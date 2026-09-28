import type { CapturedNode } from "@webiny/api-component-extraction/domain/artifacts.js";

const normalise = (text: string): string => text.replace(/\s+/g, " ").trim();

/** One text run of a section: what it says, and the element it says it in. */
export interface SectionRun {
    text: string;
    /** The leaf tag carrying the text. Alignment reads this and never the words — see `alignRunsByRole`. */
    tag: string;
}

/**
 * Every non-empty text run in a section's subtree, in document order, with its element.
 *
 * This is the per-instance material Assemble does not carry: it holds one cluster-wide sample per
 * prop, so the only way to tell one page's hero copy from another's is to walk that page's own
 * captured tree. The tag travels with the text because `deriveInstanceProps` matches runs between
 * two pages by what kind of thing they are, and two pages of one site say different words by design.
 */
export const collectSectionRuns = (node: CapturedNode): SectionRun[] => {
    const runs: SectionRun[] = [];

    const walk = (current: CapturedNode): void => {
        const text = current.text ? normalise(current.text) : "";
        if (text) {
            runs.push({ text, tag: current.tag });
        }
        for (const child of current.children) {
            walk(child);
        }
    };

    walk(node);
    return runs;
};

/**
 * The same runs as text alone, for the consumers that only need the copy.
 *
 * Deliberately a projection of `collectSectionRuns` rather than a second walk: one traversal, one
 * definition of what counts as a text run, so the coverage check and the alignment can never be
 * looking at different sets of runs.
 */
export const collectSectionTexts = (node: CapturedNode): string[] =>
    collectSectionRuns(node).map(run => run.text);
