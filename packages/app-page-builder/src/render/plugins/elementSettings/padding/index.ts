import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import { PbRenderElementStylePlugin } from "../../../../types";
import { applyPerDeviceStyleWithFallback } from "../../../utils";

const validateSpacingValue = (value: string): string => {
    const parsedValue = parseInt(value);
    if (Number.isNaN(parsedValue)) {
        return "0px";
    }
    return value;
};

export default {
    name: "pb-render-page-element-style-padding",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { padding } = get(element, "data.settings", {});

        // Set per side padding value
        ["top", "right", "bottom", "left"].forEach(side => {
            // Set per-device property value
            applyPerDeviceStyleWithFallback(({ displayMode, fallbackMode }) => {
                const fallbackPaddingValue = get(
                    style,
                    `--${kebabCase(fallbackMode)}-padding-${side}`
                );
                const adv = get(padding, `${displayMode}.advanced`, false);
                const value = adv
                    ? get(padding, `${displayMode}.${side}`, fallbackPaddingValue)
                    : get(padding, `${displayMode}.all`, fallbackPaddingValue);
                style[`--${kebabCase(displayMode)}-padding-${side}`] = validateSpacingValue(value);
            });
        });

        return style;
    }
} as PbRenderElementStylePlugin;
