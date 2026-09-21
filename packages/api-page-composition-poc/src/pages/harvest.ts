import type { CapturedNode } from "@webiny/api-component-extraction/domain/artifacts.js";

export interface HarvestedLink {
    text: string;
    href: string;
}

export interface HarvestedImage {
    src: string;
    alt: string;
}

/** A group of same-tag siblings, with how deep below the search root it sits. */
export interface SiblingGroup {
    nodes: CapturedNode[];
    depth: number;
}

const EMPTY: ReadonlySet<CapturedNode> = new Set();

const normalise = (text: string): string => text.replace(/\s+/g, " ").trim();

/** The deepest text the node carries, so a link's label comes back from the anchor itself. */
const ownText = (node: CapturedNode): string => {
    const direct = node.text ? normalise(node.text) : "";
    if (direct) {
        return direct;
    }
    for (const child of node.children) {
        const nested = ownText(child);
        if (nested) {
            return nested;
        }
    }
    return "";
};

/**
 * Walks the subtree, never entering a claimed node.
 *
 * Claim-awareness is what stops a later list input counting content an earlier one already took: a
 * footer's rows still contain every column link, so without this a `socialLinks` list would see 21
 * candidates and select the row holding the nav columns.
 */
const walk = (
    node: CapturedNode,
    claimed: ReadonlySet<CapturedNode>,
    visit: (current: CapturedNode) => void
): void => {
    visit(node);
    for (const child of node.children) {
        if (!claimed.has(child)) {
            walk(child, claimed, visit);
        }
    }
};

/**
 * Every link in the subtree, in document order, as a label/destination pair.
 *
 * The label is the anchor's own text rather than a nearby text run: a footer link is one node
 * carrying both halves, and pairing them anywhere else invites a label from one link landing beside
 * another's href.
 */
export const collectLinks = (
    node: CapturedNode,
    claimed: ReadonlySet<CapturedNode> = EMPTY
): HarvestedLink[] => {
    const links: HarvestedLink[] = [];
    walk(node, claimed, current => {
        if (current.href) {
            links.push({ text: ownText(current), href: current.href });
        }
    });
    return links;
};

/** Every image in the subtree, in document order. `alt` is "" when the element carried none. */
export const collectImages = (
    node: CapturedNode,
    claimed: ReadonlySet<CapturedNode> = EMPTY
): HarvestedImage[] => {
    const images: HarvestedImage[] = [];
    walk(node, claimed, current => {
        if (current.src) {
            images.push({ src: current.src, alt: current.alt ?? "" });
        }
    });
    return images;
};

/**
 * Text runs in the subtree that are NOT a link's label, in document order.
 *
 * A column's heading and its link labels are both text runs, so a heading field would otherwise
 * consume the first link's label and shift every following field by one.
 */
export const collectPlainTexts = (
    node: CapturedNode,
    claimed: ReadonlySet<CapturedNode> = EMPTY
): string[] => {
    const linkTexts = new Set(collectLinks(node, claimed).map(link => link.text));
    const texts: string[] = [];
    walk(node, claimed, current => {
        const text = current.text ? normalise(current.text) : "";
        if (text && !linkTexts.has(text)) {
            texts.push(text);
        }
    });
    return texts;
};

/** How much captured content a node accounts for — the measure candidate groups are ranked by. */
export const coverage = (node: CapturedNode, claimed: ReadonlySet<CapturedNode> = EMPTY): number =>
    collectLinks(node, claimed).length +
    collectImages(node, claimed).length +
    collectPlainTexts(node, claimed).length;

/**
 * Bounds, so a deep section cannot turn candidate scoring into a long walk. A captured tree is
 * capped at 4000 nodes and the structures this matches — a row of columns, a list of cards — sit
 * within a few levels of the section root; anything past these limits is not a list this can read.
 */
const MAX_DEPTH = 12;
const MAX_GROUPS = 200;

/**
 * Groups of same-tag siblings under `node`, each with its depth, skipping anything claimed.
 *
 * Candidates rather than a single answer because which grouping represents "the items" depends on
 * what the list's fields need and how much of the section each grouping explains — a footer's three
 * rows, its five columns and one column's seven list items are all sibling groups.
 *
 * `node` itself is always searched even when claimed: a nested list is derived with its own item
 * container as the root, and that container was claimed a moment earlier by the list above it.
 * Claims exclude a subtree from LATER inputs, not from the input that took it.
 */
export const siblingGroups = (
    node: CapturedNode,
    claimed: ReadonlySet<CapturedNode>
): SiblingGroup[] => {
    const groups: SiblingGroup[] = [];

    const visit = (current: CapturedNode, depth: number): void => {
        if (depth > MAX_DEPTH || groups.length >= MAX_GROUPS) {
            return;
        }

        const byTag = new Map<string, CapturedNode[]>();
        for (const child of current.children) {
            if (claimed.has(child)) {
                continue;
            }
            const siblings = byTag.get(child.tag) ?? [];
            siblings.push(child);
            byTag.set(child.tag, siblings);
        }

        for (const siblings of byTag.values()) {
            if (siblings.length > 0) {
                groups.push({ nodes: siblings, depth: depth + 1 });
            }
        }

        for (const child of current.children) {
            if (!claimed.has(child)) {
                visit(child, depth + 1);
            }
        }
    };

    visit(node, 0);
    return groups;
};
