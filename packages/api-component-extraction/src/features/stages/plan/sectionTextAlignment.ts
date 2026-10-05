import type { CapturedNode, TextAlignment } from "~/domain/artifacts.js";

/**
 * The alignments a section's text actually uses.
 *
 * `textAlign` is recorded on every captured node and read by nothing — the fourth value of this shape
 * after image sources, link destinations and type sizes. Measured across the four demo sites, 9 of 26
 * comparable sections centre text their source does not centre, and **every difference goes that way**:
 * four right-aligned footers, three left-aligned bodies, a left CTA and a left hero intro, all centred.
 * Two more render left-aligned because the generated CSS declares no alignment at all and the source
 * is not left.
 *
 * Centre is what a model writes when nothing tells it otherwise. Nothing did: neither the Plan prompt
 * nor the Generate prompt contains the word *align*.
 *
 * Why this is worth being careful about: the sources are **left 23, centre 16, right 6**. Centring is
 * right about a third of the time, which is why the reflex never showed up as a defect — and why a
 * fix must not swing the other way and stop centring the sections that should be centred.
 *
 * Per section rather than per prop, for the same reason as the type scale: attaching an alignment to
 * each text prop needs props mapped to source nodes, which is the alignment problem that put 52 props
 * across four sites in the wrong slot.
 */

/** The capture records logical values; `text-align: start` on an LTR page is `left`. */
const NORMALISED: Record<string, TextAlignment["align"]> = {
    start: "left",
    left: "left",
    end: "right",
    right: "right",
    center: "center",
    centre: "center",
    justify: "justify"
};

/**
 * Every alignment the section's text-bearing elements use, most text first.
 *
 * Text-bearing means a node with direct non-empty text and a non-zero box — the same definition the
 * type scale uses, so the two describe the same elements. A wrapper's inherited `text-align` is not a
 * decision the page made about that text.
 *
 * Weighted by area as well as counted, because the two answer different questions: a footer's six
 * right-aligned links outnumber its one left-aligned address block, while the address block is the
 * larger share of the footer. The prompt quotes the count and the order follows the area, so a
 * section's dominant alignment is the one covering most of its text rather than the one repeated most.
 */
export const sectionTextAlignment = (node: CapturedNode): TextAlignment[] => {
    const seen = new Map<TextAlignment["align"], { elements: number; area: number }>();
    let totalArea = 0;

    const walk = (current: CapturedNode): void => {
        const runs = current.textRuns ?? (current.text ? [current.text] : []);
        const text = runs.join(" ").replace(/\s+/g, " ").trim();
        const box = current.box;
        if (text && box && box.width > 0 && box.height > 0) {
            const raw = (current.styles?.textAlign ?? "").trim().toLowerCase();
            const align = NORMALISED[raw];
            if (align) {
                const area = box.width * box.height;
                const entry = seen.get(align) ?? { elements: 0, area: 0 };
                entry.elements++;
                entry.area += area;
                seen.set(align, entry);
                totalArea += area;
            }
        }
        for (const child of current.children ?? []) {
            walk(child);
        }
    };
    walk(node);

    return [...seen.entries()]
        .sort((a, b) => b[1].area - a[1].area)
        .map(([align, entry]) => ({
            align,
            elements: entry.elements,
            areaShare: totalArea > 0 ? Math.round((entry.area / totalArea) * 100) / 100 : 0
        }));
};
