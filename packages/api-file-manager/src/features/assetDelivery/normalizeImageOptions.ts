import type { AssetRequestOptions } from "~/delivery/AssetDelivery/AssetRequest.js";
// Import the pure helpers directly (never the barrel) so this module — reachable
// from the GraphQL API handler — never transitively loads `sharp`.
import { clampQuality, resolveRequestedFormat } from "./transformation/imageFormat.js";

/**
 * Normalize raw image transform query params into typed `AssetRequestOptions`.
 *
 * Mutates `options` in place: sets `width`/`quality`/`format` when valid and removes
 * them otherwise (so they never end up as stray strings in the cache-key hash).
 * `format=auto` is resolved to a concrete format using the `Accept` header.
 */
export const normalizeImageOptions = (
    options: AssetRequestOptions & Record<string, any>,
    query: Record<string, any>,
    acceptHeader: string | undefined
): void => {
    const width = query.width ? parseInt(query.width, 10) : NaN;
    if (!Number.isNaN(width) && width > 0) {
        options.width = width;
    } else {
        delete options.width;
    }

    const quality =
        query.quality !== undefined ? clampQuality(parseInt(query.quality, 10)) : undefined;
    if (quality !== undefined) {
        options.quality = quality;
    } else {
        delete options.quality;
    }

    const format = resolveRequestedFormat(query.format, acceptHeader);
    if (format) {
        options.format = format;
    } else {
        delete options.format;
    }

    const crop = parseCrop(query.crop);
    if (crop) {
        options.crop = crop;
    } else {
        delete options.crop;
    }

    const aspectRatio = parseAspectRatio(query.aspectRatio);
    if (aspectRatio) {
        options.aspectRatio = aspectRatio;
    } else {
        delete options.aspectRatio;
    }

    const focal = parseFocal(query.focal);
    if (focal) {
        options.focal = focal;
    } else {
        delete options.focal;
    }
};

/** Parse `?aspectRatio=16:9` or `?aspectRatio=1.7777` into a positive `w/h` number. */
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

/** Parse `?focal=x,y` (normalized 0–1) into a focal point. */
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

/**
 * Parse a `?crop=top,left,bottom,right` query value (normalized 0–1 edge insets)
 * into a crop object. Returns `undefined` for a missing, malformed, or no-op
 * (full-image) crop, so it never adds a stray value to the cache key.
 */
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
    // Guard against a full/empty crop and against insets that collapse the region.
    if (top === 0 && left === 0 && bottom === 0 && right === 0) {
        return undefined;
    }
    if (top + bottom >= 1 || left + right >= 1) {
        return undefined;
    }
    return { top, left, bottom, right };
};
