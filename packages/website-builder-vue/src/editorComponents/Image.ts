import { defineComponent, ref, watch, h, Fragment, type PropType } from "vue";
import { contentSdk } from "@webiny/website-builder-sdk";
import type { CssProperties } from "@webiny/website-builder-sdk";
import type { ComponentProps } from "~/types.js";

const SUPPORTED_WIDTHS = [100, 300, 500, 750, 1000, 1500, 2500];

type ImageInputs = {
    title: string;
    altText: string;
    image: {
        id: string;
        name: string;
        size: number;
        mimeType: string;
        src: string;
    };
};

type ImageProps = ComponentProps<ImageInputs>;

const getSrcSet = (src: string, widths: number[]) =>
    widths.map(w => `${src}?width=${w} ${w}w`).join(", ");

const computeSrcSetWidths = (width?: string | number): number[] => {
    if (width && String(width).endsWith("px")) {
        const px = parseInt(String(width));
        const widths: number[] = [];
        for (const w of SUPPORTED_WIDTHS) {
            widths.push(w);
            if (w >= px) {break;}
        }
        return widths;
    }
    return SUPPORTED_WIDTHS;
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
        // In editing mode start as not-loaded (fade in after load).
        // In live mode start as loaded (no fade effect needed).
        const isLoaded = ref(!contentSdk.isEditing());

        watch(
            () => props.inputs?.image?.src,
            src => {
                if (!src) {isLoaded.value = false;}
            }
        );

        function onLoad() {
            if (contentSdk.isEditing()) {
                setTimeout(() => {
                    isLoaded.value = true;
                }, 100);
            } else {
                isLoaded.value = true;
            }
        }

        return () => {
            const { inputs, styles } = props;
            const { title = "", altText, image } = inputs;
            const src = image?.src;

            if (!src) {
                return h(ImagePlaceholder, { style: styles });
            }

            if (src.endsWith(".svg")) {
                return h("object", {
                    style: { maxWidth: "100%", ...styles },
                    title,
                    data: src
                });
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const imageStyles: CssProperties = {
                maxWidth: "100%",
                opacity: isLoaded.value ? 1 : 0,
                transition: "opacity 0.3s ease",
                ...styles
            } as any;

            const srcSet = getSrcSet(src, computeSrcSetWidths(styles.width));

            return h(Fragment, null, [
                !isLoaded.value ? h(ImagePlaceholder, { style: styles }) : null,
                h("img", {
                    alt: altText,
                    title,
                    src,
                    srcset: srcSet,
                    style: imageStyles,
                    onLoad
                })
            ]);
        };
    }
});
