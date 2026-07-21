/**
 * Build asset **delivery URLs** that frame the image server-side. The delivery
 * pipeline applies the crop (`?crop`), an optional target aspect ratio + focal point
 * (`?aspectRatio`, `?focal`), resizing (`?width`), and format (`?format`) — so the
 * returned URL's pixels are already framed. Use with any renderer that loads a URL:
 * `next/image`, a plain `<img>`, Angular, React Native, Open Graph tags, email, etc.
 * Each distinct framing yields its own cacheable URL.
 */
import type { WebinyAsset } from "./types.js";

export interface WebinyAssetUrlOptions {
    /** Delivery width (snapped to the configured width ladder server-side). */
    width?: number;
    /** Output format, e.g. `"auto"` (negotiated via Accept), `"webp"`, `"avif"`. */
    format?: string;
    /** Encoder quality (1–100). */
    quality?: number;
    /** Include the per-usage crop (`image.crop`) as a server-side crop. Default `true`. */
    crop?: boolean;
    /**
     * Frame to a target aspect ratio server-side (`"16:9"` or a `w/h` number),
     * centered on the asset's focal point. Omit to deliver at the crop's own ratio.
     */
    aspectRatio?: number | string;
    /**
     * Include the asset's focal point (`image.focalPoint`) when `aspectRatio` is set.
     * Default `true`.
     */
    focal?: boolean;
}

const round = (n: number): number => Math.round(n * 10000) / 10000;

/**
 * The `crop=top,left,bottom,right` query value for an asset's per-usage crop, or
 * `undefined` when there is no crop (or a full-image, no-op crop).
 */
export const getAssetCropParam = (
    asset: Pick<WebinyAsset, "image"> | null | undefined
): string | undefined => {
    const c = asset?.image?.crop;
    if (!c || (c.top === 0 && c.left === 0 && c.bottom === 0 && c.right === 0)) {
        return undefined;
    }
    return [c.top, c.left, c.bottom, c.right].map(round).join(",");
};

/**
 * Build a delivery URL for an asset, baking the per-usage crop into the delivered
 * image (plus optional width/format/quality). Returns `""` for a missing asset.
 */
export const getWebinyAssetUrl = (
    asset: (Pick<WebinyAsset, "src" | "image"> & { src?: string }) | null | undefined,
    options: WebinyAssetUrlOptions = {}
): string => {
    const src = asset?.src;
    if (!src) {
        return "";
    }

    const params: string[] = [];
    if (options.crop !== false) {
        const crop = getAssetCropParam(asset);
        if (crop) {
            params.push(`crop=${crop}`);
        }
    }
    if (options.aspectRatio !== undefined) {
        params.push(`aspectRatio=${options.aspectRatio}`);
        const fp = asset?.image?.focalPoint;
        if (options.focal !== false && fp && !(fp.x === 0.5 && fp.y === 0.5)) {
            params.push(`focal=${round(fp.x)},${round(fp.y)}`);
        }
    }
    if (options.width) {
        params.push(`width=${options.width}`);
    }
    if (options.format) {
        params.push(`format=${options.format}`);
    }
    if (options.quality) {
        params.push(`quality=${options.quality}`);
    }

    if (params.length === 0) {
        return src;
    }
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}${params.join("&")}`;
};
