import type { SectionShape, TypeNode } from "~/domain/artifacts.js";

/**
 * A graded similarity in [0,1] between two section shapes — the basis for threshold-based clustering.
 *
 * Combines three signals, weighted: the element-type tree (dominant), the coarse geometry class, and the
 * resolved theme tokens. Exact-structural-match clustering is this at threshold 1.0 (only identical
 * shapes score 1); a lower threshold groups near-identical sections — the same block with a differently
 * nested icon, an extra wrapper — that exact matching splits apart.
 *
 * The signals never include text or image URLs (they aren't in `SectionShape`), so the same section on
 * two pages still scores 1 regardless of its copy.
 */

const TREE_WEIGHT = 0.6;
const GEOMETRY_WEIGHT = 0.25;
const TOKEN_WEIGHT = 0.15;

/** Every root-to-node tag path in the tree, as a multiset — the structural vocabulary of a section. */
const collectPaths = (node: TypeNode, prefix: string, out: Map<string, number>): void => {
    const path = prefix ? `${prefix}/${node.tag}` : node.tag;
    out.set(path, (out.get(path) ?? 0) + 1);
    for (const child of node.children) {
        collectPaths(child, path, out);
    }
};

/**
 * Jaccard over the paths present, ignoring how many times each occurs.
 *
 * With the fingerprint reaching a section's content, counting paths made content length structural:
 * Westland's five centred intros, one template, split three ways by how many paragraphs each has.
 * Which paths exist says what the section is built from; how often says how much it says.
 */
const presenceJaccard = (a: Map<string, number>, b: Map<string, number>): number => {
    const keys = new Set([...a.keys(), ...b.keys()]);
    if (keys.size === 0) {
        return 1;
    }
    let shared = 0;
    for (const key of keys) {
        if (a.has(key) && b.has(key)) {
            shared++;
        }
    }
    return shared / keys.size;
};

/** Jaccard of two token sets; two token-less sections don't discriminate, so they score 1. */
const setJaccard = (a: string[], b: string[]): number => {
    if (a.length === 0 && b.length === 0) {
        return 1;
    }
    const setB = new Set(b);
    let intersection = 0;
    for (const value of new Set(a)) {
        if (setB.has(value)) {
            intersection += 1;
        }
    }
    const union = new Set([...a, ...b]).size;
    return union === 0 ? 1 : intersection / union;
};

export const sectionSimilarity = (a: SectionShape, b: SectionShape): number => {
    const pathsA = new Map<string, number>();
    const pathsB = new Map<string, number>();
    collectPaths(a.typeTree, "", pathsA);
    collectPaths(b.typeTree, "", pathsB);

    const treeSim = presenceJaccard(pathsA, pathsB);
    const geometrySim = a.geometryClass === b.geometryClass ? 1 : 0;
    const tokenSim = setJaccard(a.tokens, b.tokens);

    return TREE_WEIGHT * treeSim + GEOMETRY_WEIGHT * geometrySim + TOKEN_WEIGHT * tokenSim;
};

/**
 * Leader (single-pass, representative-based) clustering: each item joins the existing group whose
 * representative it is most similar to, when that similarity meets the threshold; otherwise it starts a
 * new group as its representative. Deterministic in input order, O(items × groups), and free of the
 * chaining single-linkage suffers from. Returns the groups; each group's first item is its representative.
 */
export const leaderCluster = <T>(
    items: T[],
    shapeOf: (item: T) => SectionShape,
    threshold: number
): T[][] => {
    const groups: { shape: SectionShape; items: T[] }[] = [];
    for (const item of items) {
        const shape = shapeOf(item);
        let best: { shape: SectionShape; items: T[] } | null = null;
        let bestSim = -1;
        for (const group of groups) {
            const sim = sectionSimilarity(shape, group.shape);
            if (sim > bestSim) {
                bestSim = sim;
                best = group;
            }
        }
        if (best && bestSim >= threshold) {
            best.items.push(item);
        } else {
            groups.push({ shape, items: [item] });
        }
    }
    return groups.map(group => group.items);
};

/** The number of clusters `shapes` collapse into at a threshold — for the threshold-curve preview. */
export const clusterCountAt = (shapes: SectionShape[], threshold: number): number =>
    leaderCluster(shapes, shape => shape, threshold).length;

/** The highest similarity between any two shapes (the "nearest pair") — how mergeable the set is. */
export const nearestPairSimilarity = (shapes: SectionShape[]): number => {
    let nearest = 0;
    for (let i = 0; i < shapes.length; i++) {
        for (let j = i + 1; j < shapes.length; j++) {
            const sim = sectionSimilarity(shapes[i], shapes[j]);
            if (sim > nearest) {
                nearest = sim;
            }
        }
    }
    return nearest;
};
