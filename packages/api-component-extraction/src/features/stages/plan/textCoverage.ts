import type { ComponentProp, ClusterMember } from "~/domain/artifacts.js";
import { isNonContentText } from "~/features/shared/validators.js";

/**
 * Whether the contract's props can hold every member's text — the guarantee that used to live in the
 * generation prompt.
 *
 * Generate used to be handed the union of every cluster member's text under "Preserve this text
 * content exactly", while its reference image showed one member. Only the text side was enforced, so
 * a component was pushed to put four other sections' words into its own markup: 11 of 34 components
 * across the four sites were required to emit more text than their reference image contained, the
 * worst by 30x, and the nine components that rendered more than 1.5x taller than their section were
 * all in that group.
 *
 * Narrowing the prompt to the reference member fixes that and drops something real: the union was
 * protecting against a member's content having nowhere to go. This is where that protection moves
 * to. The requirement was never "the component's markup contains every member's words" — it is "the
 * component's props can hold every member's content", which is a question about the interface, is
 * answerable at Plan time, and needs no model to answer it.
 */

/** Alphanumerics only, lowercased — mirrors `words` in the text-preservation validator deliberately,
 * so coverage and preservation agree on what counts as the same string. */
const words = (text: string): string =>
    text
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[^\p{L}\p{N}]/gu, "");

/** Every observed value on a prop tree, flattened. */
const flattenObservedValues = (props: ComponentProp[]): string[] =>
    props.flatMap(prop => [
        ...(prop.observedValues ?? []).filter((v): v is string => typeof v === "string"),
        ...flattenObservedValues(prop.fields ?? [])
    ]);

export interface TextCoverage {
    /** Member texts the contract has somewhere to put. */
    covered: number;
    /** Member texts no prop can hold, deduped and capped for the artifact. */
    uncovered: string[];
    /** The full count, which `uncovered` may have capped. */
    uncoveredCount: number;
}

/** Kept bounded so a pathological cluster cannot inflate the Plan artifact. */
const UNCOVERED_SAMPLE_LIMIT = 25;

/**
 * Which of a cluster's member texts the contract's props can hold.
 *
 * A text is covered when an observed value equals it, contains it, or — because observations are
 * deduped per field, so the exact rows a page showed cannot be rebuilt from them — when it can be
 * consumed entirely by observed values in sequence. The last rule is the same allowance the
 * text-preservation validator makes, for the same reason: "Monday: 9:00AM to 6:00PM" is held by a
 * contract that observed "Monday" and "9:00AM to 6:00PM" in two fields.
 *
 * Non-content strings — icon-font ligatures, bare punctuation — are not content, so nothing is
 * required to hold them.
 */
export const coverMemberTexts = (
    members: ClusterMember[],
    props: ComponentProp[]
): TextCoverage => {
    const values = flattenObservedValues(props)
        .map(words)
        .filter(value => value.length > 0)
        .sort((a, b) => b.length - a.length);

    const seen = new Set<string>();
    const uncovered: string[] = [];
    let covered = 0;
    let uncoveredCount = 0;

    for (const member of members) {
        for (const text of member.digest?.texts ?? []) {
            if (typeof text !== "string" || isNonContentText(text)) {
                continue;
            }
            const key = words(text);
            if (key.length === 0 || seen.has(key)) {
                continue;
            }
            seen.add(key);

            // A text the page showed as its own run is often a fragment of a longer observed value —
            // "Copyright ©" against an observed "Copyright © 2026 Park City Place". The prop plainly
            // holds it, so containment counts in both directions, not only the one the
            // text-preservation validator needs.
            let held = values.some(value => value.includes(key));

            if (!held) {
                let rest = key;
                for (const value of values) {
                    if (rest.length === 0) {
                        break;
                    }
                    if (rest.includes(value)) {
                        rest = rest.replace(value, "");
                    }
                }
                held = rest.length === 0;
            }

            if (held) {
                covered++;
            } else {
                uncoveredCount++;
                if (uncovered.length < UNCOVERED_SAMPLE_LIMIT) {
                    uncovered.push(text);
                }
            }
        }
    }

    return { covered, uncovered, uncoveredCount };
};
