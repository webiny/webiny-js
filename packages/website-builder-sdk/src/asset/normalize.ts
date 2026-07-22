/**
 * Backwards-compatibility layer for the unified {@link WebinyAsset} shape.
 *
 * Two legacy shapes exist on disk and must keep rendering forever:
 *  1. Website Builder image values — `WebinyImageValue` (flat, `mimeType` +
 *     top-level `width`/`height` + `edit: { crop, hotspot, alt, caption }`).
 *  2. File Manager `metadata.imageEdit` — a bare `WebinyImageEdit`.
 *
 * `normalizeToAsset` accepts either legacy shape (or an already-unified asset)
 * and returns a well-formed `WebinyAsset`. It is intentionally defensive: bad or
 * partial input yields `null` rather than throwing, so a corrupt stored value
 * degrades to "no asset" instead of crashing a render.
 */
import type { WebinyImageEdit } from "../image/types.js";
import type { WebinyAsset, WebinyAssetCategory, WebinyAssetImage } from "./types.js";

/**
 * Bucket a MIME type into one of the three Asset categories. Anything that is not
 * an image or a video is treated as a document (the downloadable fallback).
 */
export function getAssetCategory(type?: string | null): WebinyAssetCategory {
    if (typeof type === "string") {
        if (type.startsWith("image/")) {
            return "image";
        }
        if (type.startsWith("video/")) {
            return "video";
        }
    }
    return "document";
}

const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null;
};

const asNumber = (value: unknown): number | undefined => {
    return typeof value === "number" && !Number.isNaN(value) ? value : undefined;
};

const asString = (value: unknown): string | undefined => {
    return typeof value === "string" ? value : undefined;
};

/**
 * Convert a legacy `WebinyImageEdit` (`{ crop, hotspot, alt, caption }`) plus
 * optional intrinsic dimensions into a `WebinyAssetImage`. Returns `undefined`
 * when there is nothing worth storing, so callers can leave `asset.image` unset.
 */
export function assetImageFromLegacyEdit(
    edit?: WebinyImageEdit | null,
    dimensions?: { width?: number | null; height?: number | null }
): WebinyAssetImage | undefined {
    const image: WebinyAssetImage = {};

    const width = asNumber(dimensions?.width);
    const height = asNumber(dimensions?.height);
    if (width !== undefined) {
        image.width = width;
    }
    if (height !== undefined) {
        image.height = height;
    }

    if (edit?.crop) {
        image.crop = {
            top: edit.crop.top ?? 0,
            left: edit.crop.left ?? 0,
            bottom: edit.crop.bottom ?? 0,
            right: edit.crop.right ?? 0
        };
    }
    if (edit?.hotspot) {
        image.focalPoint = { x: edit.hotspot.x, y: edit.hotspot.y };
    }
    if (edit?.alt) {
        image.alt = edit.alt;
    }
    if (edit?.caption) {
        image.caption = edit.caption;
    }

    return Object.keys(image).length > 0 ? image : undefined;
}

/**
 * Merge a per-usage override over an asset-level default, per property. Used by
 * the Admin editor to seed a starting point; frontends render the already
 * resolved `image` and never need this.
 */
export function resolveAssetImage(
    override?: WebinyAssetImage | null,
    base?: WebinyAssetImage | null
): WebinyAssetImage {
    return {
        width: override?.width ?? base?.width,
        height: override?.height ?? base?.height,
        crop: override?.crop ?? base?.crop,
        focalPoint: override?.focalPoint ?? base?.focalPoint,
        alt: override?.alt ?? base?.alt,
        caption: override?.caption ?? base?.caption
    };
}

const normalizeAssetImage = (raw: unknown): WebinyAssetImage | undefined => {
    if (!isObject(raw)) {
        return undefined;
    }
    const image: WebinyAssetImage = {};
    const width = asNumber(raw.width);
    const height = asNumber(raw.height);
    if (width !== undefined) {
        image.width = width;
    }
    if (height !== undefined) {
        image.height = height;
    }
    if (isObject(raw.crop)) {
        image.crop = {
            top: asNumber(raw.crop.top) ?? 0,
            left: asNumber(raw.crop.left) ?? 0,
            bottom: asNumber(raw.crop.bottom) ?? 0,
            right: asNumber(raw.crop.right) ?? 0
        };
    }
    if (isObject(raw.focalPoint)) {
        const x = asNumber(raw.focalPoint.x);
        const y = asNumber(raw.focalPoint.y);
        if (x !== undefined && y !== undefined) {
            image.focalPoint = { x, y };
        }
    }
    const alt = asString(raw.alt);
    if (alt) {
        image.alt = alt;
    }
    const caption = asString(raw.caption);
    if (caption) {
        image.caption = caption;
    }
    return Object.keys(image).length > 0 ? image : undefined;
};

const buildBase = (raw: Record<string, unknown>, type: string): WebinyAsset => ({
    id: asString(raw.id) ?? "",
    src: asString(raw.src) ?? "",
    name: asString(raw.name) ?? "",
    type,
    size: asNumber(raw.size) ?? 0
});

/**
 * Upgrade any supported value to the unified {@link WebinyAsset} shape:
 *  - an already-unified asset (idempotent, re-validated defensively),
 *  - a legacy Website Builder `WebinyImageValue`.
 *
 * Returns `null` for missing/invalid input.
 */
export function normalizeToAsset(input: unknown): WebinyAsset | null {
    if (!isObject(input)) {
        return null;
    }

    // The unified shape is identified by a typed sub-object (`image`/`document`/
    // `video`). Everything else is treated as a flat/legacy value — an older
    // `WebinyImageValue` (with `edit`) OR the original Website Builder file value
    // (a flat `{ id, src, type|mimeType, width, height }`). Routing all of these
    // through the legacy path preserves their top-level `width`/`height` and any
    // `edit`, so existing pages keep rendering after an upgrade. `type` is read
    // from either `mimeType` (older) or `type`.
    const hasTypedSubObject =
        isObject(input.image) || isObject(input.document) || isObject(input.video);

    if (!hasTypedSubObject) {
        const type = asString(input.mimeType) ?? asString(input.type) ?? "";
        const asset = buildBase(input, type);
        if (getAssetCategory(type) === "image") {
            const image = assetImageFromLegacyEdit(input.edit as WebinyImageEdit | undefined, {
                width: asNumber(input.width),
                height: asNumber(input.height)
            });
            if (image) {
                asset.image = image;
            }
        }
        return asset;
    }

    // Already-unified asset shape.
    const type = asString(input.type) ?? asString(input.mimeType) ?? "";
    const asset = buildBase(input, type);
    const category = getAssetCategory(type);
    if (category === "image") {
        const image = normalizeAssetImage(input.image);
        if (image) {
            asset.image = image;
        }
    } else if (category === "video") {
        if (isObject(input.video)) {
            asset.video = {
                autoplay:
                    typeof input.video.autoplay === "boolean" ? input.video.autoplay : undefined,
                poster: asString(input.video.poster)
            };
        }
    } else if (isObject(input.document)) {
        asset.document = { pages: asNumber(input.document.pages) };
    }
    return asset;
}
