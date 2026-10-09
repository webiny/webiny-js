import type { CapturedNode } from "~/domain/artifacts.js";

/**
 * One traversal of a section, collecting everything the text-only prop derivation cannot see.
 *
 * Plan derives a prop's `observedValues` from text runs, so an `Image` or `Link` prop reaches Generate
 * with nothing in it. Measured across the four demo sites: 36 image props and not one observed value,
 * and 41 of the 92 empty list/non-scalar props are links. The model fills the gap by inventing — 12 of
 * 34 components ship hardcoded `images.unsplash.com` URLs in their manifest defaults, and Promote puts
 * those in the customer's Library.
 *
 * Capture has the answers already: `CapturedNode` carries `src`, `alt` and `href`, documented as
 * content rather than tuning. Nothing downstream read them.
 *
 * The approach here is the one the page-composition proof of concept arrived at in `pages/harvest.ts`,
 * which produced 89 working file-typed bindings across the composed sites. It is reimplemented rather
 * than imported because that package's README says not to build on it and it depends on this one, not
 * the other way round. When the PoC is retired this is the copy that should survive.
 */

export interface HarvestedImage {
    src: string;
    /** "" when the element carried no alt, which is a fact about the page rather than a gap. */
    alt: string;
    /** The element it came from, so taking a value can claim it and nothing reads it twice. */
    node: CapturedNode;
}

export interface HarvestedLink {
    label: string;
    href: string;
    /** The element it came from, so taking a value can claim it and nothing reads it twice. */
    node: CapturedNode;
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
 * footer's rows still contain every column link, so without this a `socialLinks` list would see every
 * candidate in the section and select the row holding the nav columns.
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

/** Every image in the subtree, in document order. */
export const collectImages = (
    node: CapturedNode,
    claimed: ReadonlySet<CapturedNode> = EMPTY
): HarvestedImage[] => {
    const images: HarvestedImage[] = [];
    walk(node, claimed, current => {
        if (current.src) {
            images.push({ src: current.src, alt: current.alt ?? "", node: current });
        }
    });
    return images;
};

/**
 * Every link in the subtree, in document order, as a label/destination pair.
 *
 * The label is the anchor's own text rather than a nearby text run: a footer link is one node carrying
 * both halves, and pairing them anywhere else invites a label from one link landing beside another's
 * destination.
 */
export const collectLinks = (
    node: CapturedNode,
    claimed: ReadonlySet<CapturedNode> = EMPTY
): HarvestedLink[] => {
    const links: HarvestedLink[] = [];
    walk(node, claimed, current => {
        if (current.href) {
            links.push({ label: ownText(current), href: current.href, node: current });
        } else if (isSubmitControl(current)) {
            // A form's submit: a call to action with a label and no destination. Without it, a Link prop
            // for the submit took the next real link in the section — a phone number on three G5 forms.
            links.push({ label: current.text ?? "", href: "", node: current });
        }
    });
    return links;
};

/** A labelled `<input type="submit|button">` (`inputType` and its label are captured since 2026-10-09). */
const isSubmitControl = (node: CapturedNode): boolean =>
    node.tag === "input" &&
    /^(submit|button)$/.test(node.inputType ?? "") &&
    Boolean(node.text?.trim());

/**
 * Text runs in the subtree that are NOT a link's label, in document order.
 *
 * A card's heading and its link label are both text runs, so a heading field would otherwise consume
 * the first link's label and shift every following field by one.
 */
export const collectPlainTexts = (
    node: CapturedNode,
    claimed: ReadonlySet<CapturedNode> = EMPTY
): string[] => {
    const linkLabels = new Set(collectLinks(node, claimed).map(link => link.label));
    const texts: string[] = [];
    walk(node, claimed, current => {
        for (const fragment of current.textRuns ?? (current.text ? [current.text] : [])) {
            const text = normalise(fragment);
            if (text && !linkLabels.has(text)) {
                texts.push(text);
            }
        }
    });
    return texts;
};

/** How much captured content a node accounts for — the measure candidate groups are ranked by. */
export const coverage = (node: CapturedNode, claimed: ReadonlySet<CapturedNode> = EMPTY): number =>
    collectLinks(node, claimed).length +
    collectImages(node, claimed).length +
    collectPlainTexts(node, claimed).length;

/*
 * Bounds, so a deep section cannot turn candidate scoring into a long walk. A captured tree is capped
 * at 4000 nodes and the structures this matches — a row of cards, a list of highlights — sit within a
 * few levels of the section root; anything past these limits is not a list this can read.
 */
const MAX_DEPTH = 12;
const MAX_GROUPS = 200;

/**
 * Groups of same-tag siblings under `node`, each with its depth, skipping anything claimed.
 *
 * Candidates rather than a single answer, because which grouping represents "the items" depends on
 * what the list's fields need and how much of the section each grouping explains — a footer's three
 * rows, its five columns and one column's seven list items are all sibling groups.
 *
 * `node` itself is always searched even when claimed: a nested list is derived with its own item
 * container as the root, and that container was claimed a moment earlier by the list above it. Claims
 * exclude a subtree from LATER inputs, not from the input that took it.
 */
export const siblingGroups = (
    node: CapturedNode,
    claimed: ReadonlySet<CapturedNode> = EMPTY
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
            const siblings = byTag.get(child.tag);
            if (siblings) {
                siblings.push(child);
            } else {
                byTag.set(child.tag, [child]);
            }
        }
        for (const siblings of byTag.values()) {
            if (siblings.length >= 2) {
                groups.push({ nodes: siblings, depth });
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
