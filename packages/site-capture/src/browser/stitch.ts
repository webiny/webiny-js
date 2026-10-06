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
 * Tiling keeps the viewport exactly as it was when the element tree was read: move the page up by one
 * viewport, shoot the viewport, repeat, and stitch. The page is moved with a transform on `body`, never
 * scrolled. Scrolling was the first version of this, and it fired the page's own scroll handlers: on the
 * G5 sites the header turns fixed once the page scrolls, which took it out of the flow, shifted every
 * section below the first screen by ~70px against the tree, and painted the nav bar over the middle of
 * later tiles. Without scrolling, sticky elements stay where they sit at scroll 0, and fixed elements —
 * whose containing block a transformed `body` becomes — are painted once, where the tree recorded them.
 *
 * The surface Chrome paints is never larger than the viewport, so a very tall page costs tile count,
 * not GPU memory — the reason the grown viewport needed a `fullPage` fallback at all.
 */

export interface TilePlan {
    /** Document offsets to shoot, in order; the last is clamped to the page by `tileShift`. */
    offsets: number[];
    /** Height of the stitched image. */
    height: number;
    /** Set when the document is taller than the cap: the height it really had. */
    truncatedAt?: number;
}

/**
 * The offsets that cover `documentHeight` in viewport steps, capped at `maxHeight`.
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
 * Moves the page under a viewport that never scrolls: `body` is translated up by `y` pixels, so the
 * viewport shows document rows y..y+height. The page is never scrolled, so nothing that listens for
 * scrolling runs — a header that turns fixed on scroll stays as it was at scroll 0, and nothing shifts
 * the layout between the tree read and the picture. A transformed `body` also becomes the containing
 * block of its fixed descendants, so they are painted once, at the document position the tree recorded
 * for them, instead of on every tile.
 *
 * The first call records `body`'s inline transform so `restoreShiftScript` can put it back.
 */
export const shiftScript = (y: number): string => `(() => {
    const body = document.body;
    if (!body) {
        return;
    }
    if (!body.hasAttribute("data-wby-capture-transform")) {
        body.setAttribute("data-wby-capture-transform", body.style.getPropertyValue("transform") || "");
        body.setAttribute(
            "data-wby-capture-transform-priority",
            body.style.getPropertyPriority("transform") || ""
        );
    }
    window.scrollTo(0, 0);
    body.style.setProperty("transform", "translateY(${-Math.max(0, Math.floor(y))}px)", "important");
})()`;

export const restoreShiftScript = (): string => `(() => {
    const body = document.body;
    if (!body || !body.hasAttribute("data-wby-capture-transform")) {
        return;
    }
    const previous = body.getAttribute("data-wby-capture-transform");
    const priority = body.getAttribute("data-wby-capture-transform-priority") || "";
    if (previous) {
        body.style.setProperty("transform", previous, priority);
    } else {
        body.style.removeProperty("transform");
    }
    body.removeAttribute("data-wby-capture-transform");
    body.removeAttribute("data-wby-capture-transform-priority");
})()`;

/**
 * Where a tile's shift lands: never past the last full viewport of the page, so the final tile shows
 * the page's bottom rows rather than empty canvas below them.
 */
export const tileShift = (offset: number, height: number, viewportHeight: number): number =>
    Math.max(0, Math.min(offset, height - viewportHeight));

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
