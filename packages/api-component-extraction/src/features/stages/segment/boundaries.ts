import type { CapturedNode, SectionBox } from "~/domain/artifacts.js";

export interface SegmentOptions {
    /** A section must be at least this tall (px) — filters out headers, nav bars, links. */
    minHeight: number;
    /** …and at least this fraction of the viewport wide — filters out sidebars and controls. */
    minWidthRatio: number;
    viewportWidth: number;
}

/**
 * Descend through single-dominant-child wrapper nodes (`<div id="root"><div class="app">…`) to the real
 * content root, so sections are the page's actual top-level blocks rather than one giant wrapper.
 */
const findContentRoot = (node: CapturedNode): CapturedNode => {
    let current = node;
    while (
        current.children.length === 1 &&
        current.children[0].box.height >= 0.9 * current.box.height
    ) {
        current = current.children[0];
    }
    return current;
};

/**
 * Candidate section boundaries: the content root's direct children that are tall and wide enough to be
 * a section rather than a control. Boxes are in document coordinates, i.e. into the full-page screenshot,
 * so a crop can be taken from the PNG without a second visit.
 */
export const detectSections = (root: CapturedNode, options: SegmentOptions): SectionBox[] => {
    const contentRoot = findContentRoot(root);
    const sections: SectionBox[] = [];
    contentRoot.children.forEach((child, index) => {
        if (
            child.box.height >= options.minHeight &&
            child.box.width >= options.minWidthRatio * options.viewportWidth
        ) {
            sections.push({ box: child.box, index });
        }
    });
    return sections;
};
