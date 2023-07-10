import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import { PbRenderElementStylePlugin } from "~/types";
import { applyPerDeviceStyleWithFallback } from "../../../utils";

export default {
    name: "pb-render-page-element-style-grid",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const gridSettings = get(element, "data.settings.gridSettings");

        // Set per-device property value
        applyPerDeviceStyleWithFallback(({ displayMode, fallbackMode }) => {
            const fallbackValue = get(
                style,
                `--${kebabCase(fallbackMode)}-flex-direction`,
                "unset"
            );
            const flexDirection = get(gridSettings, `${displayMode}.flexDirection`, fallbackValue);

            style[`--${kebabCase(displayMode)}-flex-direction`] = flexDirection;

            if (flexDirection === "column" || flexDirection === "column-reverse") {
                style[`--${kebabCase(displayMode)}-cell-width`] = "100%";
            }
            // For backward compatibility
            if (
                (displayMode === "mobile-landscape" || displayMode === "mobile-portrait") &&
                flexDirection === "unset"
            ) {
                style[`--${kebabCase(displayMode)}-cell-width`] = "100%";
            }
        });

        return style;
    }
} as PbRenderElementStylePlugin;
