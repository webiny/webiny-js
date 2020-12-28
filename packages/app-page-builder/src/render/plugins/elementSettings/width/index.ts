import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import { plugins } from "@webiny/plugins";
import { PbRenderElementStylePlugin, PbRenderResponsiveModePlugin } from "../../../../types";

export default {
    name: "pb-render-page-element-style-width",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { width } = get(element, "data.settings", {});

        if (!width) {
            return style;
        }
        // Get display modes
        const displayModeConfigs = plugins
            .byType<PbRenderResponsiveModePlugin>("pb-render-responsive-mode")
            .map(pl => pl.config);
        // Set per-device property value
        displayModeConfigs.forEach(({ displayMode }) => {
            style[`--${kebabCase(displayMode)}-width`] = get(width, `${displayMode}.value`, "100%");
        });

        return style;
    }
} as PbRenderElementStylePlugin;
