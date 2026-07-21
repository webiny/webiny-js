/**
 * Pure geometry core for crop + hotspot rendering.
 *
 * This module is the single source of truth shared by:
 *  - the Admin editor previews (square / 4:3 / 16:9),
 *  - the Next.js render helper (`getWebinyImageProps` / `<WebinyImage>`),
 *  - and any future URL-transform loader (`?rect=…`).
 *
 * Keeping the math here guarantees that what an editor previews is exactly what
 * a visitor sees. Everything is framework-agnostic and side-effect free.
 */
import type {
    AspectRatioInput,
    WebinyImageCrop,
    WebinyImageEdit,
    WebinyImageHotspot,
    WebinyImageValue
} from "./types.js";

/** A rectangle in normalized (0..1) coordinates of the original image. */
export interface NormalizedRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * CSS needed to render an image cropped to a target aspect ratio while honoring
 * both the crop rectangle and the hotspot — without any server-side processing.
 *
 * `objectPosition` is the simpler, hotspot-only path (apply to an `object-fit:
 * cover` image). `container` + `image` is the accurate path that also honors the
 * crop rectangle via an overflow-clipped wrapper.
 */
export interface ImageRenderData {
    /** Final visible region in normalized original-image coordinates. */
    rect: NormalizedRect;
    /** `"50% 40%"` — focal point for the simple `object-fit: cover` path. */
    objectPosition: string;
    /** Wrapper style for the accurate crop path. */
    container: {
        position: "relative";
        width: "100%";
        aspectRatio: string;
        overflow: "hidden";
    };
    /** `<img>` style for the accurate crop path (absolutely positioned inside `container`). */
    image: {
        position: "absolute";
        width: string;
        height: string;
        left: string;
        top: string;
        maxWidth: "none";
        /**
         * `cover` + focal `objectPosition` are a safety net: when the passed
         * intrinsic `width`/`height` match the real image (the normal case) the
         * computed box already has the image's aspect ratio, so `cover` is a no-op.
         * If the dimensions are wrong/missing, this crops toward the focal point
         * instead of hard-stretching the image.
         */
        objectFit: "cover";
        objectPosition: string;
    };
    /** Intrinsic pixel dimensions of the original asset (pass-through). */
    intrinsicWidth: number;
    intrinsicHeight: number;
}

const clamp = (value: number, min = 0, max = 1): number => {
    if (Number.isNaN(value)) {
        return min;
    }
    return Math.min(max, Math.max(min, value));
};

const round = (n: number): number => Math.round(n * 1000) / 1000;

const DEFAULT_CROP: WebinyImageCrop = { top: 0, left: 0, bottom: 0, right: 0 };
const DEFAULT_HOTSPOT: WebinyImageHotspot = { x: 0.5, y: 0.5, width: 1, height: 1 };

/**
 * Merge a per-usage override over an asset-level default, per property. Used by
 * the Admin editor to seed a starting point; frontends render the already
 * resolved `edit` and never need this.
 */
export function resolveImageEdit(
    override?: WebinyImageEdit | null,
    assetDefault?: WebinyImageEdit | null
): WebinyImageEdit {
    return {
        crop: override?.crop ?? assetDefault?.crop,
        hotspot: override?.hotspot ?? assetDefault?.hotspot,
        alt: override?.alt ?? assetDefault?.alt,
        caption: override?.caption ?? assetDefault?.caption
    };
}

/**
 * Convert a crop (edge insets) into a normalized rectangle. Defensive against
 * missing/invalid values and against insets that would collapse the rectangle.
 */
export function getCropRect(crop?: WebinyImageCrop | null): NormalizedRect {
    const top = clamp(crop?.top ?? DEFAULT_CROP.top);
    const left = clamp(crop?.left ?? DEFAULT_CROP.left);
    const bottom = clamp(crop?.bottom ?? DEFAULT_CROP.bottom);
    const right = clamp(crop?.right ?? DEFAULT_CROP.right);

    // Guard against overlapping insets collapsing width/height to <= 0.
    const width = Math.max(0, 1 - left - right);
    const height = Math.max(0, 1 - top - bottom);

    return { x: left, y: top, width, height };
}

const resolveAspectRatio = (aspectRatio: AspectRatioInput): number => {
    if (typeof aspectRatio === "number") {
        return aspectRatio > 0 ? aspectRatio : 1;
    }
    const { width, height } = aspectRatio;
    return width > 0 && height > 0 ? width / height : 1;
};

const getHotspotCenter = (hotspot?: WebinyImageHotspot | null): { x: number; y: number } => ({
    x: clamp(hotspot?.x ?? DEFAULT_HOTSPOT.x),
    y: clamp(hotspot?.y ?? DEFAULT_HOTSPOT.y)
});

/**
 * Compute the final visible rectangle for a target aspect ratio.
 *
 * The largest rectangle of the requested aspect ratio that fits *inside the crop
 * rectangle* is centered on the hotspot and clamped to the crop bounds. When no
 * aspect ratio is requested, the crop rectangle itself is returned.
 *
 * @param value - Image value (needs intrinsic `width`/`height` and optional `edit`).
 * @param aspectRatio - Optional target ratio (`w/h` or `{ width, height }`).
 */
export function getVisibleRect(
    value: Pick<WebinyImageValue, "width" | "height" | "edit">,
    aspectRatio?: AspectRatioInput
): NormalizedRect {
    const cropRect = getCropRect(value.edit?.crop);

    if (aspectRatio === undefined || cropRect.width <= 0 || cropRect.height <= 0) {
        return cropRect;
    }

    const iw = value.width > 0 ? value.width : 1;
    const ih = value.height > 0 ? value.height : 1;
    const targetAR = resolveAspectRatio(aspectRatio);

    // Crop dimensions in pixels, and the crop's own aspect ratio.
    const cropWpx = cropRect.width * iw;
    const cropHpx = cropRect.height * ih;
    const cropAR = cropWpx / cropHpx;

    // Fit the target ratio inside the crop (the larger of the two fitting rects).
    let finalWpx: number;
    let finalHpx: number;
    if (targetAR > cropAR) {
        finalWpx = cropWpx;
        finalHpx = cropWpx / targetAR;
    } else {
        finalHpx = cropHpx;
        finalWpx = cropHpx * targetAR;
    }

    const finalW = finalWpx / iw;
    const finalH = finalHpx / ih;

    // Center on the hotspot, then clamp inside the crop rectangle.
    const center = getHotspotCenter(value.edit?.hotspot);
    const maxX = cropRect.x + cropRect.width - finalW;
    const maxY = cropRect.y + cropRect.height - finalH;
    const x = clamp(center.x - finalW / 2, cropRect.x, Math.max(cropRect.x, maxX));
    const y = clamp(center.y - finalH / 2, cropRect.y, Math.max(cropRect.y, maxY));

    return { x, y, width: finalW, height: finalH };
}

/**
 * Produce everything a renderer needs to display an image at a target aspect
 * ratio: a normalized rect (for URL transforms), a focal-point `objectPosition`
 * (simple path), and container/image CSS (accurate path honoring the crop).
 */
export function getImageRenderData(
    value: Pick<WebinyImageValue, "width" | "height" | "edit">,
    aspectRatio?: AspectRatioInput
): ImageRenderData {
    const rect = getVisibleRect(value, aspectRatio);
    const center = getHotspotCenter(value.edit?.hotspot);

    // Guard against a zero-area rect (degenerate crop) so CSS stays finite.
    const safeW = rect.width > 0 ? rect.width : 1;
    const safeH = rect.height > 0 ? rect.height : 1;

    // The display box aspect ratio: the requested ratio, or the visible rect's
    // own pixel aspect ratio when no ratio was requested.
    const boxAspectRatio =
        aspectRatio !== undefined
            ? resolveAspectRatio(aspectRatio)
            : (rect.width * (value.width || 1)) / (rect.height * (value.height || 1));

    return {
        rect,
        objectPosition: `${round(center.x * 100)}% ${round(center.y * 100)}%`,
        container: {
            position: "relative",
            width: "100%",
            aspectRatio: `${round(boxAspectRatio)}`,
            overflow: "hidden"
        },
        image: {
            position: "absolute",
            width: `${round(100 / safeW)}%`,
            height: `${round(100 / safeH)}%`,
            left: `${round(-(rect.x / safeW) * 100)}%`,
            top: `${round(-(rect.y / safeH) * 100)}%`,
            maxWidth: "none",
            objectFit: "cover",
            objectPosition: `${round(center.x * 100)}% ${round(center.y * 100)}%`
        },
        intrinsicWidth: value.width,
        intrinsicHeight: value.height
    };
}
