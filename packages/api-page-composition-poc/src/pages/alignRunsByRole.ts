import type { SectionRun } from "./collectSectionTexts.js";

/**
 * The kind of thing a text run is, collapsed so that two renderings of one component match.
 *
 * Deliberately coarse, and deliberately a list rather than a rule: every collapse is a claim that
 * two tags play one role, and each one should be arguable on sight. The heading collapse is the
 * load-bearing one — a home page's `h1` and an interior page's `h2` are the same slot at different
 * levels, and treating them as different roles was measured to produce false mismatches on sections
 * that had aligned correctly.
 */
export const runRole = (tag: string): string => {
    const lower = tag.toLowerCase();
    if (/^h[1-6]$/.test(lower)) {
        return "heading";
    }
    if (["span", "strong", "em", "b", "i", "small", "u"].includes(lower)) {
        return "inline";
    }
    if (["p", "div", "blockquote"].includes(lower)) {
        return "para";
    }
    if (["td", "th"].includes(lower)) {
        return "cell";
    }
    return lower;
};

/**
 * For each representative run, the instance run playing the same role, or -1 where there is none.
 *
 * A longest-common-subsequence over the runs' roles. Order-preserving, so it models the one thing
 * that actually happens between two renderings of a component: runs appear, runs disappear, and the
 * rest stay in sequence. An extra button ahead of a form shifts every index below it and shifts
 * nothing here, which is the whole reason this exists.
 *
 * It compares roles and never words. Two pages of one site say different things in the same slot by
 * design, so matching on text would align only the boilerplate — the parts that needed no alignment.
 */
export const alignRunsByRole = (
    representative: readonly SectionRun[],
    instance: readonly SectionRun[]
): number[] => {
    const left = representative.map(run => runRole(run.tag));
    const right = instance.map(run => runRole(run.tag));

    const table: number[][] = Array.from({ length: left.length + 1 }, () =>
        new Array<number>(right.length + 1).fill(0)
    );
    for (let i = left.length - 1; i >= 0; i--) {
        for (let j = right.length - 1; j >= 0; j--) {
            table[i]![j] =
                left[i] === right[j]
                    ? table[i + 1]![j + 1]! + 1
                    : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
        }
    }

    const mapping = new Array<number>(left.length).fill(-1);
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
        if (left[i] === right[j]) {
            mapping[i] = j;
            i += 1;
            j += 1;
        } else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
            i += 1;
        } else {
            j += 1;
        }
    }
    return mapping;
};
