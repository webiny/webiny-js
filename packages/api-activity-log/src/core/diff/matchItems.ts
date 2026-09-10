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
 * 1. **By stable id.** The authoritative match when both sides carry ids.
 * 2. **By content hash**, among whatever is left. This is one rule serving two situations that
 *    look different but are the same problem: an import that rewrote every id, and an entry
 *    written before stable ids existed being saved for the first time afterwards. In both, an
 *    unmatched item whose content equals an unmatched item on the other side is that item.
 * 3. **Whatever remains** is a genuine addition or removal.
 *
 * Ids are matched first-unused-wins rather than assumed unique, because they are only guaranteed
 * unique within one array and duplicating a block copies its nested ids verbatim.
 */
export const matchItems = (beforeItems: unknown[], afterItems: unknown[]): ItemMatching => {
    const pairs: MatchedPair[] = [];
    const usedBefore = new Set<number>();

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

    // Pass 1 — stable id.
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

    // Pass 2 — content hash, over what pass 1 could not place.
    const leftoverBefore = beforeItems
        .map((_, index) => index)
        .filter(index => !usedBefore.has(index));

    const beforeHashes = new Map<string, number[]>();
    for (const index of leftoverBefore) {
        const hash = contentHash(beforeItems[index]);
        const bucket = beforeHashes.get(hash);
        if (bucket) {
            bucket.push(index);
        } else {
            beforeHashes.set(hash, [index]);
        }
    }

    const stillUnmatchedAfter: number[] = [];

    for (const afterIndex of unmatchedAfter) {
        const hash = contentHash(afterItems[afterIndex]);
        const bucket = beforeHashes.get(hash);
        const beforeIndex = bucket?.find(candidate => !usedBefore.has(candidate));

        if (beforeIndex === undefined) {
            stillUnmatchedAfter.push(afterIndex);
            continue;
        }

        usedBefore.add(beforeIndex);
        pairs.push({ beforeIndex, afterIndex, inOrder: true });
    }

    // Pass 3 — zip whatever is left, in order, where identity cannot decide.
    //
    // This is the ordinary case on a branch without stable ids, not an edge case: with no ids and
    // no content match, editing one item of a list of objects would otherwise report a removal
    // plus an addition for what was a single edit. Zipping the leftovers in order reports it as
    // the edit it was.
    //
    // Gated on at least one side lacking an id. When both items carry ids and neither passes 1
    // nor 2 matched them, identity has spoken: they are different blocks, and a removal plus an
    // addition is the correct answer rather than a guess.
    const added: number[] = [];
    let beforeCursor = 0;

    const nextZippableBefore = (afterIndex: number): number | undefined => {
        while (beforeCursor < beforeItems.length) {
            const candidate = beforeCursor++;

            if (usedBefore.has(candidate)) {
                continue;
            }

            const bothContainers =
                isContainer(beforeItems[candidate]) && isContainer(afterItems[afterIndex]);
            const identityIsSilent =
                idOf(beforeItems[candidate]) === undefined ||
                idOf(afterItems[afterIndex]) === undefined;

            if (bothContainers && identityIsSilent) {
                return candidate;
            }

            // Not zippable: put it back, so a later after-item is not skipped past it.
            beforeCursor = candidate;
            return undefined;
        }

        return undefined;
    };

    for (const afterIndex of stillUnmatchedAfter) {
        const beforeIndex = nextZippableBefore(afterIndex);

        if (beforeIndex === undefined) {
            added.push(afterIndex);
            continue;
        }

        usedBefore.add(beforeIndex);
        pairs.push({ beforeIndex, afterIndex, inOrder: true });
    }

    // Everything still unclaimed on the before side is gone.
    const removed = beforeItems.map((_, index) => index).filter(index => !usedBefore.has(index));

    // Order detection runs over the survivors in their after-order.
    pairs.sort((a, b) => a.afterIndex - b.afterIndex);
    const keptInPlace = longestIncreasingSubsequence(pairs.map(pair => pair.beforeIndex));
    pairs.forEach((pair, position) => {
        pair.inOrder = keptInPlace.has(position);
    });

    return { pairs, added, removed };
};
