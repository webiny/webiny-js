import { get } from "lodash";
import kebabCase from "lodash/kebabCase";
import { PbRenderElementStylePlugin } from "~/types";
import { applyPerDeviceStyleWithFallback } from "../../../utils";

export default {
    name: "pb-render-page-element-style-grid",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const gridOptions = get(element, "data.settings.gridOptions");

        // Set per-device property value
        applyPerDeviceStyleWithFallback(({ displayMode, fallbackMode }) => {
            const fallbackValue = get(
                style,
                `--${kebabCase(fallbackMode)}-flex-direction`,
                "unset"
            );
            const flexDirection = get(gridOptions, `${displayMode}.flexDirection`, fallbackValue);

            style[`--${kebabCase(displayMode)}-flex-direction`] = flexDirection;

            if (flexDirection === "column" || flexDirection === "column-reverse") {
                style[`--${kebabCase(displayMode)}-cell-width`] = "100%";
            }
        });

        return style;
    }
} as PbRenderElementStylePlugin;
