import React from "react";
import { normalizeToAsset, type Asset } from "@webiny/website-builder-sdk";

export interface BackgroundImageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "style"> {
    /** The image value (unified `Asset` or a legacy value — both accepted). */
    image: Asset;
    /** Content rendered on top of the background (auto-stacked above the image). */
    children?: React.ReactNode;
    /** Class applied to the wrapper element. */
    className?: string;
    /** Styles merged into the wrapper. Give it a height (e.g. `minHeight`). */
    style?: React.CSSProperties;
    /** Class applied to the background `<img>`. */
    imgClassName?: string;
    /** Explicit alt text; falls back to the image's stored alt. Empty = decorative. */
    alt?: string;
    /** Delivery width requested for the background image. Defaults to 1920. */
    width?: number;
    /**
     * Responsive URL builder — e.g. `({ src, width }) => \`${src}?width=${width}&format=auto\``.
     * When provided, a `srcSet` is generated from `widths`.
     */
    loader?: (params: { src: string; width: number }) => string;
    /** Candidate widths for the generated `srcSet`. */
    widths?: number[];
    /** The `sizes` attribute (defaults to `100vw`, since backgrounds are usually full-bleed). */
    sizes?: string;
    /** Native loading strategy for the background image. */
    loading?: "eager" | "lazy";
}

const DEFAULT_WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048];

export function BackgroundImage({
    image,
    children,
    className,
    style,
    imgClassName,
    alt,
    width = 1920,
    loader,
    widths = DEFAULT_WIDTHS,
    sizes = "100vw",
    loading,
    ...rest
}: BackgroundImageProps) {
    const asset = normalizeToAsset(image);
    const src = asset?.src ?? "";
    const focalPoint = asset?.image?.focalPoint ?? { x: 0.5, y: 0.5 };
    const resolvedAlt = alt ?? asset?.image?.alt ?? "";

    const resolvedSrc = loader ? loader({ src, width }) : src;
    const srcSet = loader
        ? widths.map(w => `${loader({ src, width: w })} ${w}w`).join(", ") || undefined
        : undefined;

    return (
        <div
            {...rest}
            className={className}
            style={{ position: "relative", overflow: "hidden", ...style }}
        >
            <img
                className={imgClassName}
                src={resolvedSrc}
                srcSet={srcSet}
                sizes={srcSet ? sizes : undefined}
                alt={resolvedAlt}
                aria-hidden={resolvedAlt === "" ? true : undefined}
                loading={loading}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: `${focalPoint.x * 100}% ${focalPoint.y * 100}%`
                }}
            />
            {children != null ? (
                <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
            ) : null}
        </div>
    );
}
