/**
 * A full-page screenshot assembled from viewport-sized tiles, taken at the layout the page is read at.
 *
 * Both earlier ways of taking a full-page shot changed what was photographed relative to what was read:
 *
 * - `fullPage: true` captures beyond the viewport without moving the layout viewport, and Chrome
 *   paints some positioned elements wrongly in that pass — measured on parkcityplace.org, an absolute
 *   header lost its logo and every nav item on 6 of 8 pages.
 * - Growing the viewport to the document height fixed that, but re-laid the page out at a viewport
 *   thousands of pixels tall. Anything sized in `vh` — a hero at `min-height: 100vh` — grew with it,
 *   everything below moved down, and the boxes read at 1440x900 no longer matched the picture. A fixed
 *   element anchored to the viewport bottom was painted at the bottom of the whole page.
 *
 * Tiling keeps the viewport exactly as it was when the element tree was read: scroll by one viewport,
 * shoot the viewport, repeat, and stitch. Two kinds of element move with scrolling and are handled so
 * the stitched page shows them where the tree recorded them (at scroll 0):
 *
 * - `position: sticky` elements are pinned to their place in the flow for the duration, which is
 *   exactly where they sit at scroll 0 — sticky is in-flow, so pinning moves nothing else;
 * - `position: fixed` elements appear on the first tile only. At scroll 0 they occupy the first
 *   viewport, which is where the tree recorded them; on every later tile they would be painted again.
 *
 * The surface Chrome paints is never larger than the viewport, so a very tall page costs tile count,
 * not GPU memory — the reason the grown viewport needed a `fullPage` fallback at all.
 */

export interface TilePlan {
    /** Scroll offsets to shoot, in order. The browser may clamp the last one; the caller reads back. */
    offsets: number[];
    /** Height of the stitched image. */
    height: number;
    /** Set when the document is taller than the cap: the height it really had. */
    truncatedAt?: number;
}

/**
 * The scroll offsets that cover `documentHeight` in viewport steps, capped at `maxHeight`.
 *
 * A zero or unknown height still yields one tile: an empty-looking page photographed is better
 * evidence than no photograph.
 */
export const planTiles = (
    documentHeight: number,
    viewportHeight: number,
    maxHeight: number
): TilePlan => {
    const step = Math.max(1, Math.floor(viewportHeight));
    const measured = Number.isFinite(documentHeight) ? Math.floor(documentHeight) : 0;
    const height = Math.max(step, Math.min(measured, maxHeight));
    const offsets: number[] = [];
    for (let y = 0; y < height; y += step) {
        offsets.push(y);
    }
    return {
        offsets,
        height,
        ...(measured > maxHeight ? { truncatedAt: measured } : {})
    };
};

export interface ShotTile {
    /** Where the browser actually was when the tile was shot (the last scroll clamps). */
    top: number;
    bytes: Uint8Array;
}

export interface PlacedTile {
    top: number;
    /** How many rows of the tile fall inside the stitched image. */
    rows: number;
    bytes: Uint8Array;
}

/**
 * Where each tile goes and in what order to draw it.
 *
 * Tiles are drawn last-first, so the first tile is drawn on top. The last tile usually overlaps the one
 * before it because the browser clamps the final scroll; tiles agree in an overlap except for fixed
 * elements, which only the first tile shows — so where the first tile is involved, it must win.
 * Tiles that start beyond the image (a page that shrank after it was measured) are dropped.
 */
export const placeTiles = (
    tiles: ShotTile[],
    viewportHeight: number,
    height: number
): PlacedTile[] => {
    return tiles
        .filter(tile => tile.top < height)
        .map(tile => ({
            top: Math.max(0, Math.floor(tile.top)),
            rows: Math.min(viewportHeight, height - Math.max(0, Math.floor(tile.top))),
            bytes: tile.bytes
        }))
        .filter(tile => tile.rows > 0)
        .reverse();
};

/**
 * Pins sticky elements in place and marks fixed ones, so later tiles can hide them. Returns nothing;
 * `restoreTileLayoutScript` undoes exactly what this did. Inline `!important` styles, so the page's
 * own stylesheet cannot win, and the previous inline value is kept to restore.
 */
export const prepareTileLayoutScript = (): string => `(() => {
    const all = document.querySelectorAll("body *");
    for (const el of all) {
        const position = getComputedStyle(el).position;
        if (position === "sticky" || position === "-webkit-sticky") {
            el.setAttribute("data-wby-capture-sticky", el.style.getPropertyValue("position") || "");
            el.setAttribute(
                "data-wby-capture-sticky-priority",
                el.style.getPropertyPriority("position") || ""
            );
            el.style.setProperty("position", "static", "important");
        } else if (position === "fixed") {
            el.setAttribute("data-wby-capture-fixed", el.style.getPropertyValue("visibility") || "");
            el.setAttribute(
                "data-wby-capture-fixed-priority",
                el.style.getPropertyPriority("visibility") || ""
            );
        }
    }
})()`;

/** Hides the fixed elements marked by `prepareTileLayoutScript` — for every tile after the first. */
export const hideFixedScript = (): string => `(() => {
    for (const el of document.querySelectorAll("[data-wby-capture-fixed]")) {
        el.style.setProperty("visibility", "hidden", "important");
    }
})()`;

export const restoreTileLayoutScript = (): string => `(() => {
    for (const el of document.querySelectorAll("[data-wby-capture-sticky]")) {
        const previous = el.getAttribute("data-wby-capture-sticky");
        const priority = el.getAttribute("data-wby-capture-sticky-priority") || "";
        if (previous) {
            el.style.setProperty("position", previous, priority);
        } else {
            el.style.removeProperty("position");
        }
        el.removeAttribute("data-wby-capture-sticky");
        el.removeAttribute("data-wby-capture-sticky-priority");
    }
    for (const el of document.querySelectorAll("[data-wby-capture-fixed]")) {
        const previous = el.getAttribute("data-wby-capture-fixed");
        const priority = el.getAttribute("data-wby-capture-fixed-priority") || "";
        if (previous) {
            el.style.setProperty("visibility", previous, priority);
        } else {
            el.style.removeProperty("visibility");
        }
        el.removeAttribute("data-wby-capture-fixed");
        el.removeAttribute("data-wby-capture-fixed-priority");
    }
    window.scrollTo(0, 0);
})()`;

/**
 * The page's full height. Both measures, because either can be the short one: `body.scrollHeight` is
 * too small on sites where `html` scrolls and `body` is `height: 100%`, and the document element's
 * never reports less than the viewport.
 */
export const PAGE_HEIGHT_EXPRESSION =
    "Math.max(document.documentElement ? document.documentElement.scrollHeight : 0, document.body ? document.body.scrollHeight : 0)";

/**
 * Stitches tiles into one PNG.
 *
 * `sharp` is a native module provided by a Lambda layer present on the background-task runtime only, so
 * it is loaded at call time, never at module import.
 */
export const stitchTiles = async (
    tiles: PlacedTile[],
    width: number,
    height: number
): Promise<Uint8Array> => {
    const sharp = (await import("sharp")).default;
    const inputs = await Promise.all(
        tiles.map(async tile => {
            const meta = await sharp(tile.bytes).metadata();
            const rows = Math.min(tile.rows, meta.height ?? tile.rows);
            const tileWidth = Math.min(width, meta.width ?? width);
            const input =
                rows === meta.height && tileWidth === meta.width
                    ? Buffer.from(tile.bytes)
                    : await sharp(tile.bytes)
                          .extract({ left: 0, top: 0, width: tileWidth, height: rows })
                          .png()
                          .toBuffer();
            return { input, top: tile.top, left: 0 };
        })
    );

    const stitched = await sharp({
        create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
        // A 1440x32000 canvas is ~46M pixels, past sharp's default input guard.
        limitInputPixels: false
    })
        .composite(inputs)
        .png()
        .toBuffer();
    return new Uint8Array(stitched);
};
