import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import applyPerDeviceStyleWithFallback from "~/utils/applyPerDeviceStyleWithFallback";

export default ({ displayModes, element, style }) => {
    const { height } = get(element, "data.settings", {});

    applyPerDeviceStyleWithFallback({
        displayModes,
        applyStyle: ({ displayMode, fallbackMode }) => {
            const fallbackValue = get(style, `--${kebabCase(fallbackMode)}-height`, "auto");
            // Set style for display mode
            style[`--${kebabCase(displayMode)}-height`] = get(
                height,
                `${displayMode}.value`,
                fallbackValue
            );
        }
    });

    return style;
};
