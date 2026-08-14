import type { Box, CapturedNode } from "~/domain/artifacts.js";

/**
 * The captured node whose box exactly matches a detected section's box.
 *
 * Cluster resolves each Segment section back to its node this way — by geometry, not by tree position.
 * A section is not necessarily a direct child of the content root (Segment splits a page-wrapping
 * container, so sections can sit several levels down), so indexing `contentRoot.children[i]` silently
 * dropped the nested ones. A section's box is taken verbatim from its tree node during Segment and the
 * same tree is carried forward, so the match is exact. The outer-most match wins (parent before
 * children), mirroring the node Segment emitted for a single-child wrapper.
 */
export const findNodeByBox = (node: CapturedNode, box: Box): CapturedNode | null => {
    const b = node.box;
    if (b.x === box.x && b.y === box.y && b.width === box.width && b.height === box.height) {
        return node;
    }
    for (const child of node.children) {
        const found = findNodeByBox(child, box);
        if (found) {
            return found;
        }
    }
    return null;
};
