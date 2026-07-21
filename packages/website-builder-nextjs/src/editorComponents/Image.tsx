import React from "react";
import type {
    ComponentProps,
    CssProperties,
    WebinyAsset,
    WebinyImageValue
} from "@webiny/website-builder-react";
import { WebinyImage } from "@webiny/website-builder-react";

type ImageProps = ComponentProps<{
    title: string;
    altText: string;
    highPriority: boolean;
    // Accepts the unified asset shape or a legacy value (existing pages).
    image: WebinyAsset | WebinyImageValue;
}>;

export const ImageComponent = (props: ImageProps) => {
    const { title = "", altText, image, highPriority } = props.inputs;

    if (!image?.src) {
        return <ImagePlaceholder style={props.styles} />;
    }

    // Explicit alt input wins; otherwise `WebinyImage` falls back to the image's
    // stored alt (resolved from either value shape).
    const alt = altText || undefined;

    // SVGs are vector — there's no raster crop/focal point to apply.
    if (image.src.endsWith(".svg")) {
        return (
            <object style={{ maxWidth: "100%", ...props.styles }} title={title} data={image.src} />
        );
    }

    // Renders honoring the crop + hotspot (pure CSS), at the crop's own aspect
    // ratio. The Webiny asset delivery resizes (width) and serves a modern format
    // negotiated from the request's Accept header (format=auto -> AVIF/WebP),
    // driving a responsive srcSet.
    return (
        <WebinyImage
            image={image}
            alt={alt}
            title={title}
            style={props.styles}
            sizes={"100vw"}
            loading={highPriority ? "eager" : "lazy"}
            loader={({ src, width }) => `${src}?width=${width}&format=auto`}
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
