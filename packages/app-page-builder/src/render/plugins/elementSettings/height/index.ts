import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import { PbRenderElementStylePlugin } from "../../../../types";
import { applyPerDeviceStyleWithFallback } from "../../../utils";

export default {
    name: "pb-render-page-element-style-height",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { height } = get(element, "data.settings", {});

        applyPerDeviceStyleWithFallback(({ displayMode, fallbackMode }) => {
            const fallbackValue = get(style, `--${kebabCase(fallbackMode)}-height`, "auto");
            // Set style for display mode
            style[`--${kebabCase(displayMode)}-height`] = get(
                height,
                `${displayMode}.value`,
                fallbackValue
            );
        });

        return style;
    }
} as PbRenderElementStylePlugin;
