// @flow
import { get } from "lodash";
import type { PbRenderElementStylePluginType } from "@webiny/app-page-builder/types";

const scaling = {
    cover: {
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat"
    },
    contain: {
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat"
    },
    originalSize: {
        backgroundSize: "auto",
        backgroundRepeat: "no-repeat"
    },
    tile: {
        backgroundSize: "auto",
        backgroundRepeat: "repeat"
    },
    tileHorizontally: {
        backgroundSize: "auto",
        backgroundRepeat: "repeat-x"
    },
    tileVertically: {
        backgroundSize: "auto",
        backgroundRepeat: "repeat-y"
    }
};

export default ({
    name: "pb-render-page-element-style-background",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }: Object) {
        const { background } = get(element, "data.settings", {});
        if (!background) {
            return style;
        }

        const { color, image } = background;

        const src = get(image, "file.src");
        if (src) {
            return {
                ...style,
                ...scaling[image.scaling || "cover"],
                backgroundImage: `url(${src})`,
                backgroundPosition: image.position || "center center"
            };
        }

        if (color) {
            return { ...style, backgroundColor: color };
        }

        return style;
    }
}: PbRenderElementStylePluginType);
