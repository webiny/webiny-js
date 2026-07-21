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
