import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import { PbRenderElementStylePlugin } from "../../../../types";
import { applyPerDeviceStyleWithFallback } from "../../../utils";

export default {
    name: "pb-render-page-element-style-text",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const textSettings = get(element, "data.text", {});

        // Set per-device property value
        applyPerDeviceStyleWithFallback(({ displayMode, fallbackMode }) => {
            // Set text color
            style[`--${kebabCase(displayMode)}-color`] = get(
                textSettings,
                `${displayMode}.color`,
                get(style, `--${kebabCase(fallbackMode)}-color`, "inherit")
            );
            // Set text alignment
            style[`--${kebabCase(displayMode)}-text-align`] = get(
                textSettings,
                `${displayMode}.alignment`,
                get(style, `--${kebabCase(fallbackMode)}-text-align`, "inherit")
            );
        });

        return style;
    }
} as PbRenderElementStylePlugin;
