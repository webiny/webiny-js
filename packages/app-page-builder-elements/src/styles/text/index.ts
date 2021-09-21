import { get } from "lodash";
import kebabCase from "lodash/kebabCase";
import applyPerDeviceStyleWithFallback from "~/utils/applyPerDeviceStyleWithFallback";

export default ({ displayModes, element, style }) => {
    const textSettings = get(element, "data.text", {});

    // Set per-device property value
    applyPerDeviceStyleWithFallback({
        displayModes,
        applyStyle: ({ displayMode, fallbackMode }) => {
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
        }
    });

    return style;
};
