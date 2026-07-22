import React from "react";
import NextImage from "next/image";
import type {
    ComponentProps,
    CssProperties,
    WebinyAsset,
    WebinyImageValue
} from "@webiny/website-builder-react";
import {
    getWebinyAssetUrl,
    getWebinyImageDimensions,
    getWebinyImageSrcSet,
    normalizeToAsset
} from "@webiny/website-builder-react";

type ImageProps = ComponentProps<{
    title: string;
    altText: string;
    highPriority: boolean;
    // Accepts the unified asset shape or a legacy value (existing pages).
    image: WebinyAsset | WebinyImageValue;
}>;

export const ImageComponent = (props: ImageProps) => {
    const { title = "", altText, image, highPriority } = props.inputs;
    const asset = normalizeToAsset(image);

    if (!asset?.src) {
        return <ImagePlaceholder style={props.styles} />;
    }

    const alt = altText || asset.image?.alt || "";

    // SVGs are vector — nothing to crop, resize, or re-encode.
    if (asset.src.endsWith(".svg")) {
        return (
            <object style={{ maxWidth: "100%", ...props.styles }} title={title} data={asset.src} />
        );
    }

    // The delivery bakes the per-usage crop (`?crop`), resizes (`?width`), and serves
    // a modern format negotiated from Accept (`?format=auto`). We hand `next/image` a
    // loader that builds that URL, and it drives the responsive `srcSet`.
    const loader = ({ width }: { width: number }) =>
        getWebinyAssetUrl(asset, { width, format: "auto" });

    // Intrinsic size of the *delivered* (cropped) image, so next/image lays out at
    // the correct aspect ratio. Falls back to a plain <img> when dimensions are
    // unknown (next/image requires width + height unless `fill`).
    const { width, height } = getWebinyImageDimensions(asset);

    const style: CssProperties = { maxWidth: "100%", height: "auto", ...props.styles };

    if (!width || !height) {
        // No intrinsic size to lay out with — fall back to a plain <img>, still
        // responsive via the SDK's framework-agnostic srcSet (crop/format baked in).
        const { src, srcSet } = getWebinyImageSrcSet(asset, {
            format: "auto",
            cssWidth: props.styles?.width
        });
        // eslint-disable-next-line @next/next/no-img-element
        return (
            <img
                src={src}
                srcSet={srcSet}
                sizes="100vw"
                alt={alt}
                title={title || undefined}
                loading={highPriority ? "eager" : "lazy"}
                style={style}
            />
        );
    }

    return (
        <NextImage
            src={asset.src}
            loader={loader}
            alt={alt}
            title={title || undefined}
            width={width}
            height={height}
            sizes={"100vw"}
            priority={highPriority}
            style={style}
        />
    );
};

const ImagePlaceholder = ({ style }: { style: CssProperties }) => {
    return (
        <div
            style={{
                display: "flex",
                height: "200px",
                backgroundColor: "#f4f4f4",
                justifyContent: "center",
                alignItems: "center",
                fill: "#ffffff",
                ...style
            }}
        >
            <svg
                style={{
                    width: "70px",
                    height: "70px",
                    filter: "drop-shadow(rgba(0, 0, 0, 0.16) 0px 1px 0px)"
                }}
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
            >
                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z" />
            </svg>
        </div>
    );
};
