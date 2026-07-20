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
