import type { Box, CapturedNode } from "~/domain/artifacts.js";

/**
 * Where a section actually paints, which can be more than its box.
 *
 * An element's box is where layout put it; its content can be drawn outside it. Freehill's header is
 * 70px tall and its logo, positioned absolutely, hangs 53px below into the hero; thevibe's logo does
 * the same. Cropped to the box, the reference image showed an empty teal strip and half a logo, and
 * Generate built a header without one. So the crop is taken from what the section paints.
 *
 * The box itself is left alone — it is the key Plan uses to find the section's node again — and this
 * is used for the crop only.
 *
 * What counts is what draws something: an image, text, an icon, a background image. A descendant
 * that clips its overflow contributes its own box and nothing beyond it, a fixed element follows the
 * viewport rather than the section, and the reach past the box is bounded so one stray off-canvas
 * element cannot turn a header crop into half the page.
 */

/** The furthest a section's crop may reach past its box, on either side vertically. */
export const MAX_PAINT_OVERFLOW = 300;
/** Less than this is anti-aliasing and rounding, not overflow worth a different crop. */
const MIN_OVERFLOW = 8;

const clips = (node: CapturedNode): boolean => {
    const overflow = node.styles?.overflow;
    return Boolean(overflow) && overflow !== "visible";
};

const paints = (node: CapturedNode): boolean =>
    node.tag === "img" ||
    node.tag === "video" ||
    Boolean(node.text?.trim()) ||
    Boolean(node.icon) ||
    Boolean(node.background);

/** The vertical extent a subtree paints, or null when it paints nothing. */
const paintedSpan = (node: CapturedNode): { top: number; bottom: number } | null => {
    let top = Infinity;
    let bottom = -Infinity;
    const take = (from: number, to: number) => {
        top = Math.min(top, from);
        bottom = Math.max(bottom, to);
    };
    const walk = (current: CapturedNode): void => {
        if (current.styles?.position === "fixed") {
            return;
        }
        const b = current.box;
        if (b && b.width > 0 && b.height > 0 && paints(current)) {
            take(b.y, b.y + b.height);
        }
        if (clips(current)) {
            // Its content shows only inside its own box: whatever it paints, clamped to that.
            const inner = paintedChildren(current);
            if (inner && b) {
                take(Math.max(inner.top, b.y), Math.min(inner.bottom, b.y + b.height));
            }
            return;
        }
        for (const child of current.children ?? []) {
            walk(child);
        }
    };
    const paintedChildren = (current: CapturedNode) => {
        let innerTop = Infinity;
        let innerBottom = -Infinity;
        for (const child of current.children ?? []) {
            const span = paintedSpan(child);
            if (span) {
                innerTop = Math.min(innerTop, span.top);
                innerBottom = Math.max(innerBottom, span.bottom);
            }
        }
        return innerTop < innerBottom ? { top: innerTop, bottom: innerBottom } : null;
    };
    walk(node);
    return top < bottom ? { top, bottom } : null;
};

export const paintedBox = (node: CapturedNode, pageWidth: number): Box | null => {
    const box = node.box;
    // A section that clips its own overflow paints nothing outside itself.
    if (clips(node)) {
        return null;
    }
    let top = box.y;
    let bottom = box.y + box.height;
    for (const child of node.children ?? []) {
        const span = paintedSpan(child);
        if (span) {
            top = Math.min(top, span.top);
            bottom = Math.max(bottom, span.bottom);
        }
    }

    top = Math.max(top, box.y - MAX_PAINT_OVERFLOW, 0);
    bottom = Math.min(bottom, box.y + box.height + MAX_PAINT_OVERFLOW);
    if (box.y - top < MIN_OVERFLOW && bottom - (box.y + box.height) < MIN_OVERFLOW) {
        return null;
    }
    const x = Math.max(0, box.x);
    return { x, y: top, width: Math.min(box.width, pageWidth - x), height: bottom - top };
};
