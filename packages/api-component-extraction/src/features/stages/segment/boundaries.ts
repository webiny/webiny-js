import type { Box, CapturedNode } from "~/domain/artifacts.js";

/** A detected section boundary before its crop is produced (Segment attaches `cropRef`). */
export interface DetectedSection {
    box: Box;
    index: number;
}

export interface SegmentOptions {
    /** A section must be at least this tall (px) — filters out headers, nav bars, links. */
    minHeight: number;
    /** …and at least this fraction of the viewport wide — filters out sidebars and controls. */
    minWidthRatio: number;
    viewportWidth: number;
    /**
     * A near-full-width block taller than this that is really a vertical stack of several full-width
     * children is treated as a CONTAINER and split into those children, rather than taken whole as one
     * section. This is what stops a single page-wrapping element (a `<main>` / content `<div>`) from
     * swallowing the whole page as one giant section.
     */
    maxSectionHeight: number;
    /** How many stacked full-width children make a block a container to split (at least this many). */
    minChildrenToSplit: number;
}

/**
 * Descend through single-dominant-child wrapper nodes (`<div id="root"><div class="app">…`) to the real
 * content root, so sections are the page's actual top-level blocks rather than one giant wrapper.
 */
export const findContentRoot = (node: CapturedNode): CapturedNode => {
    let current = node;
    while (
        current.children.length === 1 &&
        current.children[0].box.height >= 0.9 * current.box.height
    ) {
        current = current.children[0];
    }
    return current;
};

/** A node big enough to be a section rather than a control: tall enough and near-full-width. */
const isSectionCandidate = (node: CapturedNode, options: SegmentOptions): boolean =>
    node.box.height >= options.minHeight &&
    node.box.width >= options.minWidthRatio * options.viewportWidth;

/**
 * Whether these blocks are stacked vertically (each begins at or below the previous one's bottom) rather
 * than layered on top of each other. A container of sections is a vertical stack; a hero's background and
 * content layers overlap, so they are not — which keeps a hero from being mistaken for a container and
 * split apart.
 */
const areVerticallyStacked = (children: CapturedNode[]): boolean => {
    const sorted = [...children].sort((a, b) => a.box.y - b.box.y);
    for (let i = 1; i < sorted.length; i++) {
        const previous = sorted[i - 1];
        const overlap = previous.box.y + previous.box.height - sorted[i].box.y;
        if (overlap > 0.5 * previous.box.height) {
            return false;
        }
    }
    return true;
};

/**
 * Resolve one candidate into section leaves. To decide whether the candidate is really a container of
 * sections, descend through single full-height wrappers (`<main><div class="container">…`) to reach where
 * its section-level children actually live — this also finds sections nested under a centred max-width
 * container. If that inner node is a tall vertical stack of several full-width children, the candidate is
 * a container: recurse into each child. Otherwise the candidate is itself one section, emitted with its
 * own (widest) box — so a plain section keeps its full-width box rather than collapsing to an inner column.
 */
const collectSections = (
    candidate: CapturedNode,
    out: CapturedNode[],
    options: SegmentOptions
): void => {
    const inner = findContentRoot(candidate);
    const children = inner.children.filter(child => isSectionCandidate(child, options));
    const isContainer =
        children.length >= options.minChildrenToSplit &&
        inner.box.height > options.maxSectionHeight &&
        areVerticallyStacked(children);

    if (isContainer) {
        for (const child of children) {
            collectSections(child, out, options);
        }
    } else {
        out.push(candidate);
    }
};

/**
 * The page's real content sections. Starting from the content root, each near-full-width, tall-enough
 * direct child is a candidate; a candidate that is itself a vertical stack of several full-width sections
 * is recursively split into them (so one page-wrapping element does not swallow the page as a single
 * block), while a self-contained block — a hero, a footer — is kept whole. Boxes are in document
 * coordinates, i.e. into the full-page screenshot, so a crop is taken from the PNG without a second visit.
 */
export const detectSections = (root: CapturedNode, options: SegmentOptions): DetectedSection[] => {
    const contentRoot = findContentRoot(root);
    const out: CapturedNode[] = [];
    for (const child of contentRoot.children) {
        if (isSectionCandidate(child, options)) {
            collectSections(child, out, options);
        }
    }
    return out.map((node, index) => ({ box: node.box, index }));
};
