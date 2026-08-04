import type { CSSProperties } from "react";
import {
    getAssetImageRenderData,
    normalizeToAsset,
    type AspectRatioInput,
    type Asset
} from "@webiny/website-builder-sdk";

export interface ImageProps {
    /** Wrapper style: an aspect-ratio box that clips overflow. Spread onto a container. */
    style: CSSProperties;
    /** Image style: absolutely positioned to reveal exactly the cropped/focused region. */
    imgStyle: CSSProperties;
    /** The image URL. */
    src: string;
    /** Resolved alt text (explicit override, else the image's stored alt, else ""). */
    alt: string;
    /** Intrinsic (original) pixel dimensions of the asset. */
    width: number;
    height: number;
}

export interface ImageValue {
    id: string;
    name: string;
    size: number;
    mimeType: string; // not "type"
    src: string;
    width: number; // top-level, not nested in image
    height: number; // top-level
}

export interface GetImagePropsOptions {
    /** Target aspect ratio. Omit to render at the crop's own aspect ratio. */
    aspectRatio?: AspectRatioInput;
    /** Explicit alt text; falls back to the image's stored `image.alt`. */
    alt?: string;
}

/**
 * Compute the props needed to render a Webiny image honoring its crop + focal point,
 * using pure CSS (no image backend). Works with a plain `<img>`, SSR, and static
 * export. Spread `style` onto a wrapper element and `imgStyle` onto the `<img>`.
 *
 * Accepts either the unified {@link Asset} shape or a legacy
 * `ImageValue` (existing page snapshots) — both are normalized transparently.
 *
 * This is the escape hatch for custom rendering; most consumers can use the
 * `<Image>` component instead.
 */
export function getImageProps(
    input: Asset | ImageValue,
    options: GetImagePropsOptions = {}
): ImageProps {
    const asset = normalizeToAsset(input);
    const data = getAssetImageRenderData({ image: asset?.image }, options.aspectRatio);

    return {
        style: data.container,
        imgStyle: data.image,
        src: asset?.src ?? "",
        alt: options.alt ?? asset?.image?.alt ?? "",
        width: data.intrinsicWidth,
        height: data.intrinsicHeight
    };
}
