import type { Box, CapturedNode } from "~/domain/artifacts.js";

/**
 * An object written where a URL belongs — a file input's `{ src, … }` value read bare. Both spellings,
 * since a CSS `url()` comes back percent-encoded. It names no image, so it never counts as one shown.
 */
const isStringifiedObject = (url: string): boolean =>
    url.includes("[object Object]") || url.includes("[object%20Object]");

/** The last two path segments of a URL, without its query: how render audits compare image URLs. */
export const imageUrlTail = (url: string): string =>
    url.split("?")[0].split("/").slice(-2).join("/");

/**
 * How many distinct images a rendered component showed: the image URLs the page used (`<img>`
 * sources and CSS backgrounds), counted once each, less any that failed to load. Compared by
 * `imageUrlTail`, since a CDN may answer one image under different query strings.
 */
export const renderedImageCount = (used: string[], failed: string[]): number => {
    const failedTails = new Set(failed.map(imageUrlTail));
    return new Set(
        used
            .filter(url => url && !url.startsWith("data:") && !isStringifiedObject(url))
            .map(imageUrlTail)
            .filter(tail => !failedTails.has(tail))
    ).size;
};

/** Share of `inner`'s area that lies inside `outer`. 0 for a box with no area. */
const shareInside = (inner: Box, outer: Box): number => {
    const area = inner.width * inner.height;
    if (!(area > 0)) {
        return 0;
    }
    const width =
        Math.min(inner.x + inner.width, outer.x + outer.width) - Math.max(inner.x, outer.x);
    const height =
        Math.min(inner.y + inner.height, outer.y + outer.height) - Math.max(inner.y, outer.y);
    return width > 0 && height > 0 ? (width * height) / area : 0;
};

/**
 * How many distinct images a source section showed: media `src`s and CSS background images on nodes
 * that lie at least half inside the section's box, counted once each by the same rule as
 * `renderedImageCount`, so the two sides of "expected vs rendered" are counted alike.
 *
 * Visible, not present. A slider keeps every slide in the DOM and shows one; a `<picture>` carries its
 * image twice. Counting nodes would expect four images of a four-slide carousel whose page shows one,
 * and report a faithful component as missing three.
 */
export const visibleSectionImageCount = (section: CapturedNode, box: Box): number => {
    const tails = new Set<string>();
    const visit = (node: CapturedNode) => {
        if (shareInside(node.box, box) >= 0.5) {
            for (const url of [node.src, node.background?.url]) {
                if (url && !url.startsWith("data:")) {
                    tails.add(imageUrlTail(url));
                }
            }
        }
        for (const child of node.children ?? []) {
            visit(child);
        }
    };
    visit(section);
    return tails.size;
};
