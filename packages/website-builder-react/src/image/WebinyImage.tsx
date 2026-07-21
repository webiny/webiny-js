import React from "react";
import type { AspectRatioInput, WebinyAsset, WebinyImageValue } from "@webiny/website-builder-sdk";
import { getWebinyImageProps } from "./getWebinyImageProps.js";

export interface WebinyImageComponentProps extends Omit<
    React.ImgHTMLAttributes<HTMLImageElement>,
    "src" | "width" | "height" | "style" | "alt"
> {
    /**
     * The image value from a Webiny file input. Accepts the unified `WebinyAsset`
     * shape or a legacy `WebinyImageValue` (existing pages) — both carry an
     * optional crop / focal point / alt.
     */
    image: WebinyAsset | WebinyImageValue;
    /** Target aspect ratio (e.g. `16 / 9` or `{ width, height }`). Omit for the crop's own ratio. */
    aspectRatio?: AspectRatioInput;
    /** Explicit alt text; falls back to the image's stored alt. */
    alt?: string;
    /** Class applied to the wrapper element. */
    className?: string;
    /** Class applied to the `<img>` element. */
    imgClassName?: string;
    /** Extra styles merged into the wrapper (e.g. `maxWidth`). */
    style?: React.CSSProperties;
    /**
     * Optional responsive URL builder — e.g. `({ src, width }) => \`${src}?width=${width}\``.
     * When provided, a `srcSet` is generated from `widths`. This is also the seam for a
     * future server/CDN transform (crop params can be appended here).
     */
    loader?: (params: { src: string; width: number }) => string;
    /** Candidate widths for the generated `srcSet` (defaults to a common set). */
    widths?: number[];
    /** The `sizes` attribute for responsive selection. */
    sizes?: string;
}

const DEFAULT_WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048];

/**
 * Renders a Webiny image honoring its non-destructive crop + hotspot, using pure
 * CSS — no image backend required. The wrapper is an aspect-ratio box that clips
 * to the cropped region (so it also prevents layout shift), and the `<img>` is
 * scaled/positioned inside it.
 *
 * Compatible with SSR and static export. Pass a `loader` to emit a responsive
 * `srcSet` (e.g. via the Webiny CDN's width parameter).
 */
export function WebinyImage({
    image,
    aspectRatio,
    alt,
    className,
    imgClassName,
    style,
    loader,
    widths = DEFAULT_WIDTHS,
    sizes,
    ...imgProps
}: WebinyImageComponentProps) {
    const {
        style: containerStyle,
        imgStyle,
        src,
        alt: resolvedAlt,
        width
    } = getWebinyImageProps(image, { aspectRatio, alt });

    const srcSet = loader
        ? widths
              .filter(w => !width || w <= width)
              .map(w => `${loader({ src, width: w })} ${w}w`)
              .join(", ") || undefined
        : undefined;

    const resolvedSrc = loader ? loader({ src, width: width || widths[widths.length - 1] }) : src;

    return (
        <div className={className} style={{ ...containerStyle, ...style }}>
            <img
                {...imgProps}
                className={imgClassName}
                src={resolvedSrc}
                srcSet={srcSet}
                sizes={sizes}
                alt={resolvedAlt}
                style={imgStyle}
            />
        </div>
    );
}
