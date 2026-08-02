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

    const crop = parseCrop(query.crop);
    if (crop) {
        result.crop = crop;
    }

    const aspectRatio = parseAspectRatio(query.aspectRatio);
    if (aspectRatio) {
        result.aspectRatio = aspectRatio;
    }

    const focal = parseFocal(query.focal);
    if (focal) {
        result.focal = focal;
    }

    return result;
};

const parseAspectRatio = (raw: unknown): number | undefined => {
    if (typeof raw !== "string") {
        return undefined;
    }
    if (raw.includes(":")) {
        const [w, h] = raw.split(":").map(v => parseFloat(v));
        return w > 0 && h > 0 ? w / h : undefined;
    }
    const value = parseFloat(raw);
    return !Number.isNaN(value) && value > 0 ? value : undefined;
};

const parseFocal = (raw: unknown): { x: number; y: number } | undefined => {
    if (typeof raw !== "string") {
        return undefined;
    }
    const parts = raw.split(",").map(v => parseFloat(v));
    if (parts.length !== 2 || parts.some(n => Number.isNaN(n))) {
        return undefined;
    }
    const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
    return { x: clamp01(parts[0]), y: clamp01(parts[1]) };
};

const parseCrop = (
    raw: unknown
): { top: number; left: number; bottom: number; right: number } | undefined => {
    if (typeof raw !== "string") {
        return undefined;
    }
    const parts = raw.split(",").map(v => parseFloat(v));
    if (parts.length !== 4 || parts.some(n => Number.isNaN(n))) {
        return undefined;
    }
    const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
    const [top, left, bottom, right] = parts.map(clamp01);
    if (top === 0 && left === 0 && bottom === 0 && right === 0) {
        return undefined;
    }
    if (top + bottom >= 1 || left + right >= 1) {
        return undefined;
    }
    return { top, left, bottom, right };
};
