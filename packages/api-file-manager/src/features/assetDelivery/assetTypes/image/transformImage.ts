/**
 * The sharp-backed image pipeline. This module imports `sharp` (a native module),
 * so it must ONLY be imported by the transform strategies (the image Lambda) —
 * never from the barrel (`index.ts`) or from anything the GraphQL API handler
 * loads. See `imageFormat.ts` for the reasoning.
 */
import sharp from "sharp";
import type { Sharp } from "sharp";
import { WidthCollection } from "./WidthCollection.js";
import {
    contentTypeForFormat,
    DEFAULT_IMAGE_QUALITY,
    formatFromContentType,
    type ImageFormat
} from "./imageFormat.js";

interface ApplyOutputFormatResult {
    pipeline: Sharp;
    contentType: string;
}

/**
 * Apply the target format + quality to a sharp pipeline. When no `format` is given,
 * re-encodes in the source format only if a `quality` was requested; otherwise the
 * pipeline is left untouched.
 */
const applyOutputFormat = (
    pipeline: Sharp,
    sourceContentType: string,
    options: { format?: ImageFormat; quality?: number },
    qualityDefaults: Record<ImageFormat, number>
): ApplyOutputFormatResult => {
    const targetFormat = options.format ?? formatFromContentType(sourceContentType);

    // Nothing to change: unknown source format, or neither a conversion nor a quality.
    if (!targetFormat || (!options.format && options.quality === undefined)) {
        return { pipeline, contentType: sourceContentType };
    }

    const quality = options.quality ?? qualityDefaults[targetFormat];

    switch (targetFormat) {
        case "jpeg":
            return {
                pipeline: pipeline.jpeg({ quality }),
                contentType: contentTypeForFormat("jpeg")
            };
        case "webp":
            return {
                pipeline: pipeline.webp({ quality }),
                contentType: contentTypeForFormat("webp")
            };
        case "avif":
            return {
                pipeline: pipeline.avif({ quality }),
                contentType: contentTypeForFormat("avif")
            };
        case "png":
            return {
                pipeline: pipeline.png({ quality, compressionLevel: 9, adaptiveFiltering: true }),
                contentType: contentTypeForFormat("png")
            };
    }
};

export interface TransformImageParams {
    buffer: Buffer;
    animated: boolean;
    sourceContentType: string;
    widths: number[];
    options: { width?: number; format?: ImageFormat; quality?: number };
    qualityDefaults?: Record<ImageFormat, number>;
}

export interface TransformImageResult {
    buffer: Buffer;
    contentType: string;
}

/**
 * Single sharp pipeline shared by the S3 and local transform strategies: optional
 * resize (snapped to the configured width ladder) → optional format conversion +
 * quality. Returns the resulting buffer and its content type.
 */
interface CropInsets {
    top: number;
    left: number;
    bottom: number;
    right: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Extract the crop region (edge insets, 0..1) from an image buffer. Returns the
 * original buffer unchanged if the crop is empty/full or the dimensions are unknown.
 */
export const cropImageBuffer = async (buffer: Buffer, crop: CropInsets): Promise<Buffer> => {
    const image = sharp(buffer);
    const meta = await image.metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (!w || !h) {
        return buffer;
    }

    const left = Math.max(0, Math.min(w - 1, Math.round(clamp01(crop.left) * w)));
    const top = Math.max(0, Math.min(h - 1, Math.round(clamp01(crop.top) * h)));
    const width = Math.max(
        1,
        Math.min(w - left, Math.round((1 - clamp01(crop.left) - clamp01(crop.right)) * w))
    );
    const height = Math.max(
        1,
        Math.min(h - top, Math.round((1 - clamp01(crop.top) - clamp01(crop.bottom)) * h))
    );

    if (left === 0 && top === 0 && width === w && height === h) {
        return buffer;
    }

    return image.extract({ left, top, width, height }).toBuffer();
};

interface NormalizedRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const cropToRect = (crop?: CropInsets): NormalizedRect => {
    const left = clamp01(crop?.left ?? 0);
    const top = clamp01(crop?.top ?? 0);
    return {
        x: left,
        y: top,
        width: Math.max(0, 1 - left - clamp01(crop?.right ?? 0)),
        height: Math.max(0, 1 - top - clamp01(crop?.bottom ?? 0))
    };
};

/**
 * The visible region (normalized 0–1) for the given framing. The largest rectangle
 * of `aspectRatio` that fits inside the crop, centered on the focal point.
 */
export const getVisibleRect = (
    imageWidth: number,
    imageHeight: number,
    crop?: CropInsets,
    focal?: { x: number; y: number },
    aspectRatio?: number
): NormalizedRect => {
    const cr = cropToRect(crop);
    if (aspectRatio === undefined || aspectRatio <= 0 || cr.width <= 0 || cr.height <= 0) {
        return cr;
    }
    const iw = imageWidth > 0 ? imageWidth : 1;
    const ih = imageHeight > 0 ? imageHeight : 1;
    const cropAR = (cr.width * iw) / (cr.height * ih);

    let w: number;
    let h: number;
    if (aspectRatio > cropAR) {
        w = cr.width;
        h = (cr.width * iw) / aspectRatio / ih;
    } else {
        h = cr.height;
        w = (cr.height * ih * aspectRatio) / iw;
    }

    const fx = clamp01(focal?.x ?? 0.5);
    const fy = clamp01(focal?.y ?? 0.5);
    const maxX = cr.x + cr.width - w;
    const maxY = cr.y + cr.height - h;
    const x = Math.min(Math.max(fx - w / 2, cr.x), Math.max(cr.x, maxX));
    const y = Math.min(Math.max(fy - h / 2, cr.y), Math.max(cr.y, maxY));
    return { x, y, width: w, height: h };
};

export interface Framing {
    crop?: CropInsets;
    focal?: { x: number; y: number };
    aspectRatio?: number;
}

export const hasFraming = (framing: Framing): boolean => {
    const c = framing.crop;
    const cropped = !!c && !(c.top === 0 && c.left === 0 && c.bottom === 0 && c.right === 0);
    return cropped || framing.aspectRatio !== undefined;
};

export const extractFramedRegion = async (buffer: Buffer, framing: Framing): Promise<Buffer> => {
    if (!hasFraming(framing)) {
        return buffer;
    }
    const image = sharp(buffer);
    const meta = await image.metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (!w || !h) {
        return buffer;
    }

    const rect = getVisibleRect(w, h, framing.crop, framing.focal, framing.aspectRatio);
    const left = Math.max(0, Math.min(w - 1, Math.round(rect.x * w)));
    const top = Math.max(0, Math.min(h - 1, Math.round(rect.y * h)));
    const width = Math.max(1, Math.min(w - left, Math.round(rect.width * w)));
    const height = Math.max(1, Math.min(h - top, Math.round(rect.height * h)));

    if (left === 0 && top === 0 && width === w && height === h) {
        return buffer;
    }
    return image.extract({ left, top, width, height }).toBuffer();
};

export const transformImageBuffer = async (
    params: TransformImageParams
): Promise<TransformImageResult> => {
    let pipeline = sharp(params.buffer, { animated: params.animated }).withMetadata();

    if (params.options.width) {
        const width = WidthCollection.create(params.widths).getClosestOrMax(params.options.width);
        pipeline = pipeline.resize({ width, withoutEnlargement: true });
    }

    const { pipeline: encoded, contentType } = applyOutputFormat(
        pipeline,
        params.sourceContentType,
        params.options,
        params.qualityDefaults ?? DEFAULT_IMAGE_QUALITY
    );

    const buffer = await encoded.toBuffer();

    return { buffer, contentType };
};
