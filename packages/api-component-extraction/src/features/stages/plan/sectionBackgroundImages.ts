import type { CapturedNode, SectionBackgroundImage } from "~/domain/artifacts.js";

/**
 * The background images a section paints, largest area first.
 *
 * The fifth value of the shape this project keeps finding: measured during capture and never reaching
 * the stage that needs it — except this one was not even captured until now. `background-image` was
 * absent from the eighteen properties the evaluator recorded, so a hero whose photograph is a CSS
 * background had no image at all as far as the pipeline was concerned.
 *
 * What made that worse than a gap: the element beneath the photo still has a `background-color`, and
 * that fallback was the largest painted colour in the section. Park city's hero measured
 * `#a65f46` over 696,960px — the terracotta behind a dark blue city photograph — so Plan bound the
 * section background to it and Generate painted the whole hero terracotta. The colour instruction was
 * faithful to a page property and unfaithful to the page.
 *
 * So this exists in two halves. `resolveSectionColours` stops reporting a colour an image covers,
 * which removes the wrong instruction; this supplies the right one.
 */

/** Bounded so a gallery of background-image tiles cannot fill the prompt. */
const MAX_IMAGES = 4;

/**
 * An image worth naming covers real area.
 *
 * A background-image is also how a page draws an icon, a chevron, a texture swatch — at 16-32px those
 * are decoration, not the section's background, and listing them would bury the one that matters.
 */
const MIN_AREA_SHARE = 0.1;

export const sectionBackgroundImages = (node: CapturedNode): SectionBackgroundImage[] => {
    const sectionArea = node.box.width * node.box.height;
    if (sectionArea <= 0) {
        return [];
    }
    const byUrl = new Map<string, SectionBackgroundImage>();

    const walk = (current: CapturedNode): void => {
        const background = current.background;
        const box = current.box;
        if (background?.url && box && box.width > 0 && box.height > 0) {
            const area = box.width * box.height;
            if (area >= MIN_AREA_SHARE * sectionArea) {
                const existing = byUrl.get(background.url);
                if (existing) {
                    existing.area += area;
                } else {
                    byUrl.set(background.url, { ...background, area: Math.round(area) });
                }
            }
        }
        for (const child of current.children ?? []) {
            walk(child);
        }
    };
    walk(node);

    return [...byUrl.values()].sort((a, b) => b.area - a.area).slice(0, MAX_IMAGES);
};
