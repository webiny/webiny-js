import type { Box } from "~/domain/artifacts.js";

/**
 * Derived-image helpers. `sharp` is a native Lambda-layer module present only on the background-task
 * runtime (where stages execute), not on the GraphQL Lambda — so it is imported lazily at call time,
 * never at module load.
 */

/** Below this share of a box inside the screenshot, a crop is a fragment, not the section. */
const MIN_VISIBLE_FRACTION = 0.5;
/** A crop shorter than this shows nothing a model can reproduce, whatever share of the box it is. */
const MIN_VISIBLE_PX = 16;
/** Rounding at the edges is not a partial crop. */
const FULLY_VISIBLE_FRACTION = 0.99;

export interface CropRegion {
    left: number;
    top: number;
    width: number;
    height: number;
}

export type SectionCropPlan =
    | { status: "ok" | "partial"; region: CropRegion; visibleFraction: number }
    | { status: "outside"; visibleFraction: number };

/**
 * Where a section's box falls in its page's screenshot, in the screenshot's pixels.
 *
 * The box is in document coordinates at the capture width; the screenshot can be narrower (a
 * downscaled tall page), so the box is scaled first. Then it is intersected with the image:
 *
 * - entirely inside → `ok`;
 * - partly outside, most of it inside → `partial`, cropping the part that is there;
 * - mostly or entirely outside, or too thin to show anything → `outside`, no crop.
 *
 * This replaces a clamp that never failed: a box below the bottom of the image was clamped to the last
 * row and given a height of 1, so a section the screenshot did not contain came back as a 1-pixel crop,
 * stored, and sent to the model as the section to reproduce.
 */
export const planSectionCrop = (
    box: Box,
    imageWidth: number,
    imageHeight: number,
    desktopWidth: number
): SectionCropPlan => {
    if (!(imageWidth > 0) || !(imageHeight > 0) || !(desktopWidth > 0)) {
        return { status: "outside", visibleFraction: 0 };
    }
    const scale = imageWidth / desktopWidth;
    const x0 = box.x * scale;
    const y0 = box.y * scale;
    const x1 = (box.x + box.width) * scale;
    const y1 = (box.y + box.height) * scale;
    const area = (x1 - x0) * (y1 - y0);
    if (!(area > 0)) {
        return { status: "outside", visibleFraction: 0 };
    }

    const visibleWidth = Math.min(imageWidth, x1) - Math.max(0, x0);
    const visibleHeight = Math.min(imageHeight, y1) - Math.max(0, y0);
    if (visibleWidth <= 0 || visibleHeight <= 0) {
        return { status: "outside", visibleFraction: 0 };
    }

    const visibleFraction = Math.min(1, (visibleWidth * visibleHeight) / area);
    if (visibleFraction < MIN_VISIBLE_FRACTION || visibleHeight < MIN_VISIBLE_PX) {
        return { status: "outside", visibleFraction };
    }

    const left = Math.min(imageWidth - 1, Math.round(Math.max(0, x0)));
    const top = Math.min(imageHeight - 1, Math.round(Math.max(0, y0)));
    const region: CropRegion = {
        left,
        top,
        width: Math.max(1, Math.min(imageWidth - left, Math.round(visibleWidth))),
        height: Math.max(1, Math.min(imageHeight - top, Math.round(visibleHeight)))
    };

    return {
        status: visibleFraction >= FULLY_VISIBLE_FRACTION ? "ok" : "partial",
        region,
        visibleFraction
    };
};

export interface SectionCrop {
    /** The crop, or null when the plan says there is nothing usable to crop. */
    image: Buffer | null;
    plan: SectionCropPlan;
}

/**
 * Crop a section out of a page's full-page screenshot and downscale it, keeping the section's native
 * width up to `maxWidth` and bounding only its height by `maxHeight`. A single longest-edge cap would
 * crush the width of a tall section the same way it crushed the screenshot — so width and height are
 * capped independently. The screenshot is stored at (near) the `desktopWidth`-wide capture width, so the
 * document-space box is scaled to the screenshot's actual pixels first.
 */
export const cropFromScreenshot = async (
    screenshot: Uint8Array,
    box: Box,
    desktopWidth: number,
    maxWidth: number,
    maxHeight: number
): Promise<SectionCrop> => {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(screenshot).metadata();
    const plan = planSectionCrop(box, meta.width ?? desktopWidth, meta.height ?? 0, desktopWidth);
    if (plan.status === "outside") {
        return { image: null, plan };
    }

    const image = await sharp(screenshot)
        .extract(plan.region)
        .resize({ width: maxWidth, height: maxHeight, fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
    return { image, plan };
};

/** Downscale an image to a longest-edge cap (for the capture-grid page thumbnails). */
export const downscale = async (image: Uint8Array, maxEdge: number): Promise<Buffer> => {
    const sharp = (await import("sharp")).default;
    return sharp(image)
        .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
};
