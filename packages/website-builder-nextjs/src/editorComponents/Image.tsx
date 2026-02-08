import React from "react";
import Image from "next/image";
import type { CssProperties } from "@webiny/website-builder-react";
import type { ComponentProps } from "@webiny/website-builder-react";

type ImageProps = ComponentProps<{
    title: string;
    altText: string;
    highPriority: boolean;
    image: {
        id: string;
        name: string;
        size: number;
        mimeType: string;
        src: string;
        width: number;
        height: number;
    };
}>;

export const ImageComponent = (props: ImageProps) => {
    const image = useImage(props);

    if (!image.src) {
        return <ImagePlaceholder style={props.styles} />;
    }

    if (image.tag === "object") {
        return <object style={image.styles} title={image.title} data={image.src} />;
    }

    return (
        <div
            style={{
                position: "relative",
                ...props.styles
            }}
        >
            {/* <ImagePlaceholder style={image.styles} /> */}
            <Image
                alt={image.altText}
                title={image.title}
                src={image.src}
                width={props.inputs.image.width}
                height={props.inputs.image.height}
                style={image.styles}
                priority={props.inputs.highPriority}
                loading={props.inputs.highPriority ? "eager" : "lazy"}
                sizes={"100vw"}
                loader={({ src, width }) => `${src}?width=${width}`}
            />
        </div>
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

const useImage = ({ inputs, styles }: ImageProps) => {
    const { title = "", altText, image } = inputs;
    const src = image?.src;

    const tag = src && src.endsWith(".svg") ? "object" : "img";

    const imageStyles = {
        maxWidth: "100%",
        ...styles
    };

    return {
        altText,
        src: inputs.image?.src,
        styles: imageStyles,
        tag,
        title
    };
};
