import type { CSSProperties } from "react";
import {
    getAssetImageRenderData,
    normalizeToAsset,
    type AspectRatioInput,
    type WebinyAsset,
    type WebinyImageValue
} from "@webiny/website-builder-sdk";

export interface WebinyImageProps {
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

export interface GetWebinyImagePropsOptions {
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
 * Accepts either the unified {@link WebinyAsset} shape or a legacy
 * `WebinyImageValue` (existing page snapshots) — both are normalized transparently.
 *
 * This is the escape hatch for custom rendering; most consumers can use the
 * `<WebinyImage>` component instead.
 */
export function getWebinyImageProps(
    input: WebinyAsset | WebinyImageValue,
    options: GetWebinyImagePropsOptions = {}
): WebinyImageProps {
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
