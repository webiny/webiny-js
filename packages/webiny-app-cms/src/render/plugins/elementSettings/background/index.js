// @flow
import { get } from "lodash";
import type { CmsRenderElementStylePluginType } from "webiny-app-cms/types";

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
    name: "cms-render-element-style-background",
    type: "cms-render-element-style",
    renderStyle({ element, style }: Object) {
        const { background } = get(element, "data.settings", {});
        if (!background) {
            return style;
        }

        const { color, image } = background;

        if (image && image.src) {
            return {
                ...style,
                ...scaling[image.scaling || "cover"],
                backgroundImage: `url(${image.src})`,
                backgroundPosition: image.position || "center center"
            };
        }

        if (color) {
            return { ...style, backgroundColor: color };
        }

        return style;
    }
}: CmsRenderElementStylePluginType);
