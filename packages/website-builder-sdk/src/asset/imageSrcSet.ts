/**
 * Framework-agnostic responsive-image helpers built on {@link getWebinyAssetUrl}.
 *
 * Every renderer (Next.js, React, Vue, Nuxt — and any future Angular / React Native
 * / vanilla adapter) needs the same three things from a `WebinyAsset`: a width
 * ladder, a `srcSet` with the per-usage crop/focal/format baked into each width, and
 * the delivered image's intrinsic (cropped) dimensions for layout-shift-free
 * rendering. Keeping that logic here — instead of re-deriving it per framework —
 * makes each renderer a thin adapter over the one delivery-URL contract.
 */
import type { WebinyAsset } from "./types.js";
import { getWebinyAssetUrl, type WebinyAssetUrlOptions } from "./deliveryUrl.js";

/**
 * Canonical delivery-width ladder. Kept in lockstep with the server's resize ladder
 * (`imageResizeWidths` in `@webiny/api-file-manager`) so every width a renderer
 * requests snaps to a cached variant instead of forcing a fresh transform.
 */
export const IMAGE_RESIZE_WIDTHS = [128, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840] as const;

/** Parse an aspect ratio given as a number, a `"w:h"` string, or a decimal string. */
const parseAspectRatio = (input: number | string | undefined): number | undefined => {
    if (input === undefined) {
        return undefined;
    }
    if (typeof input === "number") {
        return input > 0 ? input : undefined;
    }
    const trimmed = input.trim();
    if (trimmed.includes(":")) {
        const [w, h] = trimmed.split(":").map(Number);
        return w > 0 && h > 0 ? w / h : undefined;
    }
    const n = Number(trimmed);
    return n > 0 ? n : undefined;
};

/** Resolve a fixed CSS width to pixels, or `undefined` for fluid widths (`%`, `vw`, …). */
const toPx = (cssWidth: number | string | undefined): number | undefined => {
    if (cssWidth === undefined) {
        return undefined;
    }
    if (typeof cssWidth === "number") {
        return cssWidth > 0 ? cssWidth : undefined;
    }
    const trimmed = cssWidth.trim();
    if (trimmed.endsWith("px")) {
        const n = parseInt(trimmed, 10);
        return n > 0 ? n : undefined;
    }
    return undefined;
};

/**
 * Trim the ladder to the smallest set that still covers a fixed CSS width, including
 * one step past `2×` for high-DPR screens. Fluid widths use the full ladder.
 */
const resolveWidths = (
    widths: readonly number[],
    cssWidth: number | string | undefined
): number[] => {
    const px = toPx(cssWidth);
    if (!px) {
        return [...widths];
    }
    const result: number[] = [];
    for (const w of widths) {
        result.push(w);
        if (w >= px * 2) {
            break;
        }
    }
    return result.length ? result : [widths[widths.length - 1]];
};

export interface WebinyImageDimensions {
    /** Delivered (cropped) width in pixels, or `0` when the intrinsic size is unknown. */
    width: number;
    /** Delivered (cropped) height in pixels, or `0` when the intrinsic size is unknown. */
    height: number;
}

/**
 * The intrinsic dimensions of the *delivered* image — i.e. after the per-usage crop
 * (and an optional target aspect ratio) are applied. Renderers pass these to their
 * layout primitive (e.g. `next/image`'s `width`/`height`) so the box reserves the
 * right space and the page doesn't shift as the image loads. Returns `0`/`0` when the
 * asset's intrinsic size is unknown.
 */
export const getWebinyImageDimensions = (
    asset: Pick<WebinyAsset, "image"> | null | undefined,
    options: { aspectRatio?: number | string } = {}
): WebinyImageDimensions => {
    const img = asset?.image;
    const iw = img?.width ?? 0;
    const ih = img?.height ?? 0;
    if (!iw || !ih) {
        return { width: 0, height: 0 };
    }
    const crop = img?.crop;
    const width = crop ? Math.round((1 - (crop.left ?? 0) - (crop.right ?? 0)) * iw) : iw;
    const height = crop ? Math.round((1 - (crop.top ?? 0) - (crop.bottom ?? 0)) * ih) : ih;

    const ar = parseAspectRatio(options.aspectRatio);
    if (ar) {
        // Framed to a fixed ratio server-side: keep the cropped width, derive height.
        return { width, height: Math.round(width / ar) };
    }
    return { width, height };
};

export interface WebinyImageSrcSetOptions extends Omit<WebinyAssetUrlOptions, "width"> {
    /** Widths to emit. Defaults to {@link IMAGE_RESIZE_WIDTHS}, trimmed by `cssWidth`. */
    widths?: readonly number[];
    /**
     * A fixed CSS width for the rendered image (`"320px"` or `320`). When set, the
     * ladder is trimmed to the smallest set that still covers it (incl. high-DPR);
     * fluid widths (`%`, `vw`, unset) use the full ladder.
     */
    cssWidth?: number | string;
}

export interface WebinyImageSrcSet {
    /** Single-URL fallback for clients that ignore `srcSet` (the largest emitted width). */
    src: string;
    /** `"<url> 128w, <url> 384w, …"` — crop/focal/format baked into every width. */
    srcSet: string;
    /** Delivered (cropped) intrinsic dimensions; `0` when unknown. */
    width: number;
    height: number;
}

/**
 * Build the responsive descriptor for an asset: a `srcSet` across the width ladder
 * (each entry a delivery URL with the per-usage crop/focal/format baked in), a
 * single-URL `src` fallback, and the delivered dimensions. Framework-agnostic — hand
 * `src`/`srcSet` to any `<img>`-like primitive. Returns empty strings for a missing
 * asset.
 */
export const getWebinyImageSrcSet = (
    asset: (Pick<WebinyAsset, "src" | "image"> & { src?: string }) | null | undefined,
    options: WebinyImageSrcSetOptions = {}
): WebinyImageSrcSet => {
    const { widths = IMAGE_RESIZE_WIDTHS, cssWidth, ...urlOptions } = options;
    const dims = getWebinyImageDimensions(asset, { aspectRatio: urlOptions.aspectRatio });

    if (!asset?.src) {
        return { src: "", srcSet: "", width: dims.width, height: dims.height };
    }

    const selected = resolveWidths(widths, cssWidth);
    const srcSet = selected
        .map(w => `${getWebinyAssetUrl(asset, { ...urlOptions, width: w })} ${w}w`)
        .join(", ");
    const src = getWebinyAssetUrl(asset, { ...urlOptions, width: selected[selected.length - 1] });

    return { src, srcSet, width: dims.width, height: dims.height };
};
