import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import { plugins } from "@webiny/plugins";
import { PbRenderElementStylePlugin, PbRenderResponsiveModePlugin } from "../../../../types";

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

export default {
    name: "pb-render-page-element-style-background",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { background } = get(element, "data.settings", {});

        // Get display modes
        const displayModeConfigs = plugins
            .byType<PbRenderResponsiveModePlugin>("pb-render-responsive-mode")
            .map(pl => pl.config);

        // Set per-device property value
        displayModeConfigs.forEach(({ displayMode }) => {
            // Set background color
            style[`--${kebabCase(displayMode)}-background-color`] = get(
                background,
                `${displayMode}.color`,
                "unset"
            );
            // Set background image properties
            const image = get(background, `${displayMode}.image`);
            const src = get(image, "file.src");
            if (src) {
                const scaleSettings = get(scaling, get(image, "scaling"), {});
                const position = get(image, "position", "center center");

                style[`--${kebabCase(displayMode)}-background-size`] = scaleSettings.backgroundSize;
                style[`--${kebabCase(displayMode)}-background-repeat`] =
                    scaleSettings.backgroundRepeat;
                style[`--${kebabCase(displayMode)}-background-image`] = src ? `url(${src})` : "";
                style[`--${kebabCase(displayMode)}-background-position`] = position;
            } else {
                style[`--${kebabCase(displayMode)}-background-size`] = "none";
                style[`--${kebabCase(displayMode)}-background-repeat`] = "none";
                style[`--${kebabCase(displayMode)}-background-image`] = "none";
                style[`--${kebabCase(displayMode)}-background-position`] = "none";
            }
        });

        return style;
    }
} as PbRenderElementStylePlugin;
