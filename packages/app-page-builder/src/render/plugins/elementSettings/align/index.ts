import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import { PbRenderElementStylePlugin } from "../../../../types";
import { applyPerDeviceStyleWithFallback } from "../../../utils";

export default [
    {
        name: "pb-render-page-element-style-horizontal-align",
        type: "pb-render-page-element-style",
        renderStyle({ element, style }) {
            const { horizontalAlign } = get(element, "data.settings", {});
            if (!horizontalAlign) {
                return style;
            }
            return { ...style, textAlign: horizontalAlign };
        }
    },
    {
        name: "pb-render-page-element-style-horizontal-align-flex",
        type: "pb-render-page-element-style",
        renderStyle({ element, style }) {
            const { horizontalAlignFlex } = get(element, "data.settings", {});

            // Set per-device property value
            applyPerDeviceStyleWithFallback(({ displayMode, fallbackMode }) => {
                const fallbackValue = get(
                    style,
                    `--${kebabCase(fallbackMode)}-justify-content`,
                    "flex-start"
                );

                style[`--${kebabCase(displayMode)}-justify-content`] = get(
                    horizontalAlignFlex,
                    displayMode,
                    fallbackValue
                );
            });

            return style;
        }
    },
    {
        name: "pb-render-page-element-style-vertical-align",
        type: "pb-render-page-element-style",
        renderStyle({ element, style }) {
            const { verticalAlign } = get(element, "data.settings", {});

            // Set per-device property value
            applyPerDeviceStyleWithFallback(({ displayMode, fallbackMode }) => {
                const fallbackValue = get(
                    style,
                    `--${kebabCase(fallbackMode)}-align-items`,
                    "flex-start"
                );

                style[`--${kebabCase(displayMode)}-align-items`] = get(
                    verticalAlign,
                    displayMode,
                    fallbackValue
                );
            });

            return style;
        }
    }
] as PbRenderElementStylePlugin[];
