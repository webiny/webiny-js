import type { Box } from "~/domain/artifacts.js";

/**
 * Derived-image helpers. `sharp` is a native Lambda-layer module present only on the background-task
 * runtime (where stages execute), not on the GraphQL Lambda — so it is imported lazily at call time,
 * never at module load.
 */

const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));

/**
 * Crop a section out of a page's full-page screenshot and downscale it to `maxEdge`. The screenshot was
 * itself downscaled from a `desktopWidth`-wide capture, so the document-space box is scaled to the
 * screenshot's actual pixels first.
 */
export const cropFromScreenshot = async (
    screenshot: Uint8Array,
    box: Box,
    desktopWidth: number,
    maxEdge: number
): Promise<Buffer> => {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(screenshot).metadata();
    const imageWidth = meta.width ?? desktopWidth;
    const imageHeight = meta.height ?? 0;
    const scale = imageWidth / desktopWidth;

    const left = clamp(Math.round(box.x * scale), 0, Math.max(0, imageWidth - 1));
    const top = clamp(Math.round(box.y * scale), 0, Math.max(0, imageHeight - 1));
    const width = clamp(Math.round(box.width * scale), 1, imageWidth - left);
    const height = clamp(Math.round(box.height * scale), 1, imageHeight - top);

    return sharp(screenshot)
        .extract({ left, top, width, height })
        .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
};

/** Downscale an image to a longest-edge cap (for the capture-grid page thumbnails). */
export const downscale = async (image: Uint8Array, maxEdge: number): Promise<Buffer> => {
    const sharp = (await import("sharp")).default;
    return sharp(image)
        .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
};
