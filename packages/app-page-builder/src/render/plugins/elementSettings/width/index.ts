import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import { PbRenderElementStylePlugin } from "../../../../types";
import { applyPerDeviceStyleWithFallback } from "../../../utils";

export default {
    name: "pb-render-page-element-style-width",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { width } = get(element, "data.settings", {});

        applyPerDeviceStyleWithFallback(({ displayMode, fallbackMode }) => {
            const fallbackValue = get(style, `--${kebabCase(fallbackMode)}-width`, "100%");

            style[`--${kebabCase(displayMode)}-width`] = get(
                width,
                `${displayMode}.value`,
                fallbackValue
            );
        });

        return style;
    }
} as PbRenderElementStylePlugin;
