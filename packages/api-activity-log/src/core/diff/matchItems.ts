import { contentHash } from "./contentHash.js";

export interface MatchedPair {
    beforeIndex: number;
    afterIndex: number;
    /** True when the item kept its place relative to the other survivors. */
    inOrder: boolean;
}

export interface ItemMatching {
    pairs: MatchedPair[];
    /** Indices into the after list. */
    added: number[];
    /** Indices into the before list. */
    removed: number[];
}

const idOf = (item: unknown): string | undefined => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
        return undefined;
    }

    const id = (item as { _id?: unknown })._id;
    return typeof id === "string" && id !== "" ? id : undefined;
};

const isContainer = (value: unknown): value is Record<string, unknown> => {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date)
    );
};

/**
 * Longest strictly-increasing subsequence, returned as the set of positions it occupies.
 *
 * Patience sorting, so O(n log n). This is what stops a single insertion cascading: adding one
 * block shifts every later block's index, and without this every one of them would read as moved.
 * The longest run that kept its relative order is treated as "did not move", leaving only the
 * genuinely displaced items to report.
 */
export const longestIncreasingSubsequence = (values: number[]): Set<number> => {
    if (values.length === 0) {
        return new Set();
    }

    // tails[k] = position in `values` of the smallest tail of an increasing run of length k+1.
    const tails: number[] = [];
    const previous: number[] = new Array(values.length).fill(-1);

    for (let i = 0; i < values.length; i++) {
        let low = 0;
        let high = tails.length;

        while (low < high) {
            const mid = (low + high) >> 1;
            if (values[tails[mid]!]! < values[i]!) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        if (low > 0) {
            previous[i] = tails[low - 1]!;
        }

        tails[low] = i;
    }

    const result = new Set<number>();
    let cursor = tails[tails.length - 1]!;

    while (cursor !== -1) {
        result.add(cursor);
        cursor = previous[cursor]!;
    }

    return result;
};

/**
 * Pairs up the items of two lists, in three passes of decreasing confidence.
 *
 * 1. **By stable id.** The authoritative match when both sides carry ids. Matched first-unused-wins
 *    rather than assumed unique, because ids are only guaranteed unique within one array and
 *    duplicating a block copies its nested ids verbatim.
 * 2. **By content hash**, among whatever is left. One rule serving two situations that look
 *    different but are the same problem: an import that rewrote every id, and an entry written
 *    before stable ids existed being saved for the first time afterwards. In both, an unmatched
 *    item whose content equals an unmatched item on the other side is that item.
 * 3. **By position, anchored between confirmed matches.** Needed because a branch without stable
 *    ids reaches here for every ordinary nested edit, which would otherwise report as a removal
 *    plus an addition.
 *
 * Whatever remains after all three is a genuine addition or removal.
 */
export const matchItems = (beforeItems: unknown[], afterItems: unknown[]): ItemMatching => {
    const pairs: MatchedPair[] = [];
    const usedBefore = new Set<number>();
    const added: number[] = [];

    // ---- Pass 1: stable id -------------------------------------------------------------------

    const byId = new Map<string, number[]>();
    beforeItems.forEach((item, index) => {
        const id = idOf(item);
        if (id === undefined) {
            return;
        }
        const bucket = byId.get(id);
        if (bucket) {
            bucket.push(index);
        } else {
            byId.set(id, [index]);
        }
    });

    const unmatchedAfter: number[] = [];

    afterItems.forEach((item, afterIndex) => {
        const id = idOf(item);
        const bucket = id === undefined ? undefined : byId.get(id);
        const beforeIndex = bucket?.find(candidate => !usedBefore.has(candidate));

        if (beforeIndex === undefined) {
            unmatchedAfter.push(afterIndex);
            return;
        }

        usedBefore.add(beforeIndex);
        pairs.push({ beforeIndex, afterIndex, inOrder: true });
    });

    // ---- Pass 2: content hash ----------------------------------------------------------------

    const beforeHashes = new Map<string, number[]>();
    beforeItems.forEach((item, index) => {
        if (usedBefore.has(index)) {
            return;
        }
        const hash = contentHash(item);
        const bucket = beforeHashes.get(hash);
        if (bucket) {
            bucket.push(index);
        } else {
            beforeHashes.set(hash, [index]);
        }
    });

    const stillUnmatchedAfter: number[] = [];

    for (const afterIndex of unmatchedAfter) {
        const bucket = beforeHashes.get(contentHash(afterItems[afterIndex]));
        const beforeIndex = bucket?.find(candidate => !usedBefore.has(candidate));

        if (beforeIndex === undefined) {
            stillUnmatchedAfter.push(afterIndex);
            continue;
        }

        usedBefore.add(beforeIndex);
        pairs.push({ beforeIndex, afterIndex, inOrder: true });
    }

    // ---- Pass 3: position, anchored between confirmed matches ---------------------------------
    //
    // Anchoring is the whole point. A flat zip over the leftover sets pairs across the confirmed
    // matches that separate them: insert a block at the top and edit a different block lower down,
    // and the leftovers are one original on the left against an inserted item and an edited item
    // on the right. Zipped flat, the inserted block is paired with the edited block's original —
    // reporting field changes inside something that was just inserted, and reporting the block
    // that actually changed as an addition. Right counts, wrong items.
    //
    // So the confirmed matches partition both lists, and leftovers may only pair with leftovers
    // inside the same gap. Only the order-preserving backbone of the confirmed matches can serve
    // as boundaries: a match that moved would produce overlapping gaps.
    //
    // Within one gap there is nothing left to distinguish the candidates — no id, no equal
    // content — so they pair in order. That keeps the shape of the answer right (the counts of
    // edits, additions and removals) while leaving which leftover is "the same item" arbitrary,
    // which is the honest position when identity is absent.

    const isZippable = (beforeIndex: number, afterIndex: number): boolean => {
        const bothContainers =
            isContainer(beforeItems[beforeIndex]) && isContainer(afterItems[afterIndex]);

        // When both items carry ids and neither pass 1 nor pass 2 matched them, identity has
        // spoken: they are different blocks, and a removal plus an addition is the answer.
        const identityIsSilent =
            idOf(beforeItems[beforeIndex]) === undefined ||
            idOf(afterItems[afterIndex]) === undefined;

        return bothContainers && identityIsSilent;
    };

    const orderedMatches = [...pairs].sort((a, b) => a.afterIndex - b.afterIndex);
    const backbone = longestIncreasingSubsequence(orderedMatches.map(pair => pair.beforeIndex));
    const anchors = orderedMatches.filter((_, position) => backbone.has(position));

    const unusedBeforeIn = (low: number, high: number): number[] => {
        const indices: number[] = [];
        for (let index = low + 1; index < high; index++) {
            if (!usedBefore.has(index)) {
                indices.push(index);
            }
        }
        return indices;
    };

    const zipGap = (beforeLow: number, beforeHigh: number, afterLow: number, afterHigh: number) => {
        const candidates = unusedBeforeIn(beforeLow, beforeHigh);
        const targets = stillUnmatchedAfter.filter(index => index > afterLow && index < afterHigh);

        let cursor = 0;

        for (const afterIndex of targets) {
            let paired = false;

            while (cursor < candidates.length) {
                const beforeIndex = candidates[cursor]!;

                if (!isZippable(beforeIndex, afterIndex)) {
                    // Leave this candidate in place: a later item in the same gap may take it.
                    break;
                }

                usedBefore.add(beforeIndex);
                pairs.push({ beforeIndex, afterIndex, inOrder: true });
                cursor++;
                paired = true;
                break;
            }

            if (!paired) {
                added.push(afterIndex);
            }
        }
    };

    let beforeLow = -1;
    let afterLow = -1;

    for (const anchor of anchors) {
        zipGap(beforeLow, anchor.beforeIndex, afterLow, anchor.afterIndex);
        beforeLow = anchor.beforeIndex;
        afterLow = anchor.afterIndex;
    }

    zipGap(beforeLow, beforeItems.length, afterLow, afterItems.length);

    // ---- Whatever is left ---------------------------------------------------------------------

    const removed = beforeItems.map((_, index) => index).filter(index => !usedBefore.has(index));

    added.sort((a, b) => a - b);

    // Order detection runs over every survivor, in their after-order.
    pairs.sort((a, b) => a.afterIndex - b.afterIndex);
    const keptInPlace = longestIncreasingSubsequence(pairs.map(pair => pair.beforeIndex));
    pairs.forEach((pair, position) => {
        pair.inOrder = keptInPlace.has(position);
    });

    return { pairs, added, removed };
};
