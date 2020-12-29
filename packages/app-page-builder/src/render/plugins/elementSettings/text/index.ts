import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import { plugins } from "@webiny/plugins";
import { PbRenderElementStylePlugin, PbRenderResponsiveModePlugin } from "../../../../types";

export default {
    name: "pb-render-page-element-style-text",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const textSettings = get(element, "data.text", {});
        // Get display modes
        const displayModeConfigs = plugins
            .byType<PbRenderResponsiveModePlugin>("pb-render-responsive-mode")
            .map(pl => pl.config);

        // Set per-device property value
        displayModeConfigs.forEach(({ displayMode }) => {
            // Set text color
            style[`--${kebabCase(displayMode)}-color`] = get(
                textSettings,
                `${displayMode}.color`,
                "unset"
            );
            // Set text alignment
            style[`--${kebabCase(displayMode)}-text-align`] = get(
                textSettings,
                `${displayMode}.alignment`,
                "unset"
            );
        });

        return style;
    }
} as PbRenderElementStylePlugin;
