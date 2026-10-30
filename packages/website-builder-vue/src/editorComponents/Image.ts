import { defineComponent, h, type PropType } from "vue";
import { getImageSrcSet, normalizeToAsset } from "@webiny/website-builder-sdk";
import type { Asset, CssProperties } from "@webiny/website-builder-sdk";

type ImageInputs = {
    title: string;
    altText: string;
    highPriority: boolean;
    // Accepts the unified asset shape or a legacy value (existing pages).
    image: Asset;
};

const ImagePlaceholder = (props: { style: CssProperties }) =>
    h(
        "div",
        {
            style: {
                display: "flex",
                height: "200px",
                backgroundColor: "#f4f4f4",
                justifyContent: "center",
                alignItems: "center",
                fill: "#ffffff",
                ...props.style
            }
        },
        [
            h(
                "svg",
                {
                    style: {
                        width: "70px",
                        height: "70px",
                        filter: "drop-shadow(rgba(0, 0, 0, 0.16) 0px 1px 0px)"
                    },
                    xmlns: "http://www.w3.org/2000/svg",
                    height: "24px",
                    viewBox: "0 -960 960 960",
                    width: "24px"
                },
                [
                    h("path", {
                        d: "M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z"
                    })
                ]
            )
        ]
    );

export const ImageComponent = defineComponent({
    name: "WebinyImageComponent",
    props: {
        inputs: { type: Object as PropType<ImageInputs>, required: true },
        styles: { type: Object as PropType<CssProperties>, default: () => ({}) }
    },
    setup(props) {
        return () => {
            const { inputs, styles } = props;
            const { title = "", altText, image, highPriority } = inputs;
            const asset = normalizeToAsset(image);

            if (!asset?.src) {
                return h(ImagePlaceholder, { style: styles });
            }

            // SVGs are vector — nothing to crop, resize, or re-encode.
            if (asset.src.endsWith(".svg")) {
                return h("object", {
                    style: { maxWidth: "100%", ...styles },
                    title,
                    data: asset.src
                });
            }

            // The delivery bakes the per-usage crop (`?crop`), resizes (`?width`), and serves
            // a modern format negotiated from Accept (`?format=auto`). The width and height of
            // the delivered (cropped) image let the browser reserve the box before it loads.
            const { src, srcSet, width, height } = getImageSrcSet(asset, {
                format: "auto",
                cssWidth: styles.width as string | number | undefined
            });

            return h("img", {
                src,
                srcset: srcSet,
                sizes: "100vw",
                width: width || undefined,
                height: height || undefined,
                alt: altText || asset.image?.alt || "",
                title: title || undefined,
                loading: highPriority ? "eager" : "lazy",
                fetchpriority: highPriority ? "high" : undefined,
                style: { maxWidth: "100%", height: "auto", ...styles }
            });
        };
    }
});
