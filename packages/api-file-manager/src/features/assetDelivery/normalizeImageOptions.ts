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
};
