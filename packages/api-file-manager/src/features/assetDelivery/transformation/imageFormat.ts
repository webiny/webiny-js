/**
 * Pure image-format helpers. IMPORTANT: this module must NOT import `sharp` (a
 * native module). It is reachable from the GraphQL API handler via the asset
 * request resolvers, and loading `sharp` there would crash that Lambda. The
 * actual sharp pipeline lives in `transformImage.ts`, which only the transform
 * strategies (the image Lambda) import.
 */

export type ImageFormat = "jpeg" | "png" | "webp" | "avif";

export const SUPPORTED_OUTPUT_FORMATS: ImageFormat[] = ["jpeg", "png", "webp", "avif"];

/**
 * Default encoder quality per output format. AVIF reaches a comparable visual
 * quality at a lower number than JPEG/WebP, hence the lower default.
 */
export const DEFAULT_IMAGE_QUALITY: Record<ImageFormat, number> = {
    jpeg: 75,
    png: 80,
    webp: 75,
    avif: 55
};

const CONTENT_TYPE_BY_FORMAT: Record<ImageFormat, string> = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif"
};

export const contentTypeForFormat = (format: ImageFormat): string => CONTENT_TYPE_BY_FORMAT[format];

export const formatFromContentType = (contentType: string): ImageFormat | undefined => {
    switch (contentType) {
        case "image/jpeg":
        case "image/jpg":
            return "jpeg";
        case "image/png":
            return "png";
        case "image/webp":
            return "webp";
        case "image/avif":
            return "avif";
        default:
            return undefined;
    }
};

/**
 * Resolve a requested format string into a concrete output format.
 *
 * `"auto"` negotiates from the `Accept` header (AVIF ▸ WebP ▸ keep original), which
 * is how we approach `next/image`'s automatic modern-format delivery. Returns
 * `undefined` when the original format should be kept.
 */
export const resolveRequestedFormat = (
    requested: string | undefined,
    acceptHeader: string | undefined
): ImageFormat | undefined => {
    if (!requested) {
        return undefined;
    }

    if (requested === "auto") {
        const accept = acceptHeader ?? "";
        if (accept.includes("image/avif")) {
            return "avif";
        }
        if (accept.includes("image/webp")) {
            return "webp";
        }
        return undefined;
    }

    return SUPPORTED_OUTPUT_FORMATS.includes(requested as ImageFormat)
        ? (requested as ImageFormat)
        : undefined;
};

/** Clamp a requested quality into the valid 1–100 range; `undefined` when absent/invalid. */
export const clampQuality = (value: number | undefined): number | undefined => {
    if (value === undefined || Number.isNaN(value)) {
        return undefined;
    }
    return Math.min(100, Math.max(1, Math.round(value)));
};
