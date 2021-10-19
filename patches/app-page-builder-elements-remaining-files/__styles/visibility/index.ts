import { get } from "lodash";
import kebabCase from "lodash/kebabCase";
import { PbRenderElementStylePlugin } from "~/types";
import applyPerDeviceStyleWithFallback from "~/utils/applyPerDeviceStyleWithFallback";

export default {
    name: "pb-render-page-element-style-visibility",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const visibility = get(element, "data.settings.visibility");

        // Set per-device property value
        applyPerDeviceStyleWithFallback(({ breakpoint, fallbackMode }) => {
            const hidden = get(visibility, `${breakpoint}.hidden`);
            const defaultValue = "visible";

            if (hidden === undefined) {
                // Set visibility
                style[`--${kebabCase(breakpoint)}-visibility`] = get(
                    style,
                    `--${kebabCase(fallbackMode)}-visibility`,
                    defaultValue
                );
            } else {
                // Set visibility
                style[`--${kebabCase(breakpoint)}-visibility`] = hidden ? "hidden" : defaultValue;
            }
        });

        return style;
    }
} as PbRenderElementStylePlugin;
