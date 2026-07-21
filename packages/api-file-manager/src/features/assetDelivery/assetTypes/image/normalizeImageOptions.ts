import type { ImageRequestOptions } from "./imageTypes.js";
import { clampQuality, resolveRequestedFormat } from "./imageFormat.js";

/**
 * Parse raw query params into typed image request options.
 * Returns a new `ImageRequestOptions` object; does not mutate the input.
 */
export const normalizeImageOptions = (
    query: Record<string, any>,
    acceptHeader: string | undefined
): ImageRequestOptions => {
    const result: ImageRequestOptions = {
        original: "original" in query
    };

    const width = query.width ? parseInt(query.width, 10) : NaN;
    if (!Number.isNaN(width) && width > 0) {
        result.width = width;
    }

    const quality =
        query.quality !== undefined ? clampQuality(parseInt(query.quality, 10)) : undefined;
    if (quality !== undefined) {
        result.quality = quality;
    }

    const format = resolveRequestedFormat(query.format, acceptHeader);
    if (format) {
        result.format = format;
    }

    return result;
};
