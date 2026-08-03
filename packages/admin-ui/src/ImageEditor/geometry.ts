/**
 * Preview geometry for the image editor.
 *
 * IMPORTANT: this is a deliberate, minimal mirror of the canonical geometry core
 * in `@webiny/website-builder-sdk` (`src/image/geometry.ts`). The SDK copy is the
 * source of truth used for live frontend rendering; this copy exists only so the
 * design-system layer stays free of an SDK dependency. Keep the two in sync — the
 * whole point is that the editor preview matches what the site renders.
 */
import type { ImageEditorCrop, ImageEditorHotspot } from "./types.js";

export interface PreviewStyles {
    container: React.CSSProperties;
    image: React.CSSProperties;
}

const clamp = (value: number, min = 0, max = 1): number => {
    if (Number.isNaN(value)) {
        return min;
    }
    return Math.min(max, Math.max(min, value));
};

const round = (n: number): number => Math.round(n * 1000) / 1000;

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const getCropRect = (crop?: ImageEditorCrop | null): Rect => {
    const top = clamp(crop?.top ?? 0);
    const left = clamp(crop?.left ?? 0);
    const bottom = clamp(crop?.bottom ?? 0);
    const right = clamp(crop?.right ?? 0);
    return {
        x: left,
        y: top,
        width: Math.max(0, 1 - left - right),
        height: Math.max(0, 1 - top - bottom)
    };
};

/**
 * The largest rectangle of `ratio` (w/h) that fits inside the crop, centered on
 * the hotspot and clamped to the crop bounds.
 */
export const getVisibleRect = (
    imageWidth: number,
    imageHeight: number,
    crop: ImageEditorCrop | undefined,
    hotspot: ImageEditorHotspot | undefined,
    ratio: number
): Rect => {
    const cropRect = getCropRect(crop);
    if (cropRect.width <= 0 || cropRect.height <= 0) {
        return cropRect;
    }

    const iw = imageWidth > 0 ? imageWidth : 1;
    const ih = imageHeight > 0 ? imageHeight : 1;
    const targetAR = ratio > 0 ? ratio : 1;

    const cropWpx = cropRect.width * iw;
    const cropHpx = cropRect.height * ih;
    const cropAR = cropWpx / cropHpx;

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

    const hx = clamp(hotspot?.x ?? 0.5);
    const hy = clamp(hotspot?.y ?? 0.5);
    const maxX = cropRect.x + cropRect.width - finalW;
    const maxY = cropRect.y + cropRect.height - finalH;
    const x = clamp(hx - finalW / 2, cropRect.x, Math.max(cropRect.x, maxX));
    const y = clamp(hy - finalH / 2, cropRect.y, Math.max(cropRect.y, maxY));

    return { x, y, width: finalW, height: finalH };
};

/**
 * CSS for an overflow-clipped container + absolutely positioned image that shows
 * exactly the visible rect for a given aspect ratio.
 */
export const getPreviewStyles = (
    imageWidth: number,
    imageHeight: number,
    crop: ImageEditorCrop | undefined,
    hotspot: ImageEditorHotspot | undefined,
    ratio: number
): PreviewStyles => {
    const rect = getVisibleRect(imageWidth, imageHeight, crop, hotspot, ratio);
    const safeW = rect.width > 0 ? rect.width : 1;
    const safeH = rect.height > 0 ? rect.height : 1;

    return {
        container: {
            position: "relative",
            width: "100%",
            aspectRatio: `${round(ratio > 0 ? ratio : 1)}`,
            overflow: "hidden"
        },
        image: {
            position: "absolute",
            width: `${round(100 / safeW)}%`,
            height: `${round(100 / safeH)}%`,
            left: `${round(-(rect.x / safeW) * 100)}%`,
            top: `${round(-(rect.y / safeH) * 100)}%`,
            maxWidth: "none",
            // Safety net: when the intrinsic dimensions match the image, the box
            // already has the image's aspect ratio so `cover` is a no-op. If the
            // dimensions are wrong/missing, this crops toward the focal point
            // instead of hard-stretching the image.
            objectFit: "cover",
            objectPosition: `${round(clamp(hotspot?.x ?? 0.5) * 100)}% ${round(clamp(hotspot?.y ?? 0.5) * 100)}%`
        }
    };
};

export interface CroppedImageRenderStyles {
    wrapper: React.CSSProperties;
    image: React.CSSProperties;
}

/**
 * Styles to render an already-cropped image inside a measured box, honoring the
 * crop (and, for `cover`, the hotspot). Use when you know the box's pixel size:
 *  - `cover`: fills the box, cover-cropping the crop region toward the hotspot;
 *  - `contain`: fits the whole crop region inside the box (centered by the parent).
 */
export const getCroppedImageRenderStyles = (
    imageWidth: number,
    imageHeight: number,
    crop: ImageEditorCrop | undefined,
    hotspot: ImageEditorHotspot | undefined,
    opts: { boxWidth: number; boxHeight: number; fit: "cover" | "contain" }
): CroppedImageRenderStyles => {
    const imageStyle = (rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    }): React.CSSProperties => {
        const safeW = rect.width > 0 ? rect.width : 1;
        const safeH = rect.height > 0 ? rect.height : 1;
        return {
            position: "absolute",
            width: `${round(100 / safeW)}%`,
            height: `${round(100 / safeH)}%`,
            left: `${round(-(rect.x / safeW) * 100)}%`,
            top: `${round(-(rect.y / safeH) * 100)}%`,
            maxWidth: "none",
            // See getPreviewStyles: no-op when dimensions are correct, graceful
            // crop toward the focal point when they aren't (instead of stretching).
            objectFit: "cover",
            objectPosition: `${round(clamp(hotspot?.x ?? 0.5) * 100)}% ${round(clamp(hotspot?.y ?? 0.5) * 100)}%`
        };
    };

    if (opts.fit === "cover") {
        const targetAspect = opts.boxHeight > 0 ? opts.boxWidth / opts.boxHeight : 1;
        const rect = getVisibleRect(imageWidth, imageHeight, crop, hotspot, targetAspect);
        return {
            wrapper: { position: "relative", width: "100%", height: "100%", overflow: "hidden" },
            image: imageStyle(rect)
        };
    }

    // contain: fit the whole crop region within the box, preserving its aspect.
    const cropRect = getCropRect(crop);
    const iw = imageWidth > 0 ? imageWidth : 1;
    const ih = imageHeight > 0 ? imageHeight : 1;
    const cropWpx = (cropRect.width > 0 ? cropRect.width : 1) * iw;
    const cropHpx = (cropRect.height > 0 ? cropRect.height : 1) * ih;
    const cropAspect = cropWpx / cropHpx;

    let width = opts.boxWidth;
    let height = opts.boxWidth / cropAspect;
    if (height > opts.boxHeight) {
        height = opts.boxHeight;
        width = opts.boxHeight * cropAspect;
    }

    return {
        wrapper: {
            position: "relative",
            width: `${round(width)}px`,
            height: `${round(height)}px`,
            overflow: "hidden"
        },
        image: imageStyle(cropRect)
    };
};
