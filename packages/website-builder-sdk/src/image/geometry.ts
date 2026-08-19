/**
 * Pure geometry core for crop + focal point rendering.
 *
 * This module is the single source of truth shared by:
 *  - the Admin editor previews (square / 4:3 / 16:9),
 *  - the Next.js render helper (`getImageProps` / `<Image>`),
 *  - and any future URL-transform loader (`?rect=…`).
 *
 * Keeping the math here guarantees that what an editor previews is exactly what
 * a visitor sees. Everything is framework-agnostic and side-effect free.
 */
import type { AssetCrop, AssetFocalPoint, AssetImage } from "@webiny/sdk";
import type { AspectRatioInput } from "./types.js";

/** A rectangle in normalized (0..1) coordinates of the original image. */
export interface NormalizedRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * CSS needed to render an image cropped to a target aspect ratio while honoring
 * both the crop rectangle and the focal point — without any server-side processing.
 *
 * `objectPosition` is the simpler, focal-point-only path (apply to an `object-fit:
 * cover` image). `container` + `image` is the accurate path that also honors the
 * crop rectangle via an overflow-clipped wrapper.
 */
export interface ImageRenderData {
    rect: NormalizedRect;
    objectPosition: string;
    container: {
        position: "relative";
        width: "100%";
        aspectRatio: string;
        overflow: "hidden";
    };
    image: {
        position: "absolute";
        width: string;
        height: string;
        left: string;
        top: string;
        maxWidth: "none";
        objectFit: "cover";
        objectPosition: string;
    };
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

const DEFAULT_CROP: AssetCrop = { top: 0, left: 0, bottom: 0, right: 0 };
const DEFAULT_FOCAL_POINT: AssetFocalPoint = { x: 0.5, y: 0.5 };

export function resolveAssetImage(
    override?: AssetImage | null,
    assetDefault?: AssetImage | null
): AssetImage {
    return {
        crop: override?.crop ?? assetDefault?.crop,
        focalPoint: override?.focalPoint ?? assetDefault?.focalPoint,
        alt: override?.alt ?? assetDefault?.alt,
        caption: override?.caption ?? assetDefault?.caption
    };
}

export function getCropRect(crop?: AssetCrop | null): NormalizedRect {
    const top = clamp(crop?.top ?? DEFAULT_CROP.top);
    const left = clamp(crop?.left ?? DEFAULT_CROP.left);
    const bottom = clamp(crop?.bottom ?? DEFAULT_CROP.bottom);
    const right = clamp(crop?.right ?? DEFAULT_CROP.right);

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

const getFocalCenter = (fp?: AssetFocalPoint | null): { x: number; y: number } => ({
    x: clamp(fp?.x ?? DEFAULT_FOCAL_POINT.x),
    y: clamp(fp?.y ?? DEFAULT_FOCAL_POINT.y)
});

export function getVisibleRect(image: AssetImage, aspectRatio?: AspectRatioInput): NormalizedRect {
    const cropRect = getCropRect(image.crop);

    if (aspectRatio === undefined || cropRect.width <= 0 || cropRect.height <= 0) {
        return cropRect;
    }

    const iw = (image.width ?? 0) > 0 ? image.width! : 1;
    const ih = (image.height ?? 0) > 0 ? image.height! : 1;
    const targetAR = resolveAspectRatio(aspectRatio);

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

    const center = getFocalCenter(image.focalPoint);
    const maxX = cropRect.x + cropRect.width - finalW;
    const maxY = cropRect.y + cropRect.height - finalH;
    const x = clamp(center.x - finalW / 2, cropRect.x, Math.max(cropRect.x, maxX));
    const y = clamp(center.y - finalH / 2, cropRect.y, Math.max(cropRect.y, maxY));

    return { x, y, width: finalW, height: finalH };
}

export function getImageRenderData(
    image: AssetImage,
    aspectRatio?: AspectRatioInput
): ImageRenderData {
    const rect = getVisibleRect(image, aspectRatio);
    const center = getFocalCenter(image.focalPoint);

    const safeW = rect.width > 0 ? rect.width : 1;
    const safeH = rect.height > 0 ? rect.height : 1;

    const iw = image.width || 1;
    const ih = image.height || 1;

    const boxAspectRatio =
        aspectRatio !== undefined
            ? resolveAspectRatio(aspectRatio)
            : (rect.width * iw) / (rect.height * ih);

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
        intrinsicWidth: iw,
        intrinsicHeight: ih
    };
}
