import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import applyPerDeviceStyleWithFallback from "~/utils/applyPerDeviceStyleWithFallback";

export default ({ displayModes, element, style }) => {
    const { width } = get(element, "data.settings", {});

    applyPerDeviceStyleWithFallback({
        displayModes,
        applyStyle: ({ displayMode, fallbackMode }) => {
            const fallbackValue = get(style, `--${kebabCase(fallbackMode)}-width`, "100%");

            style[`--${kebabCase(displayMode)}-width`] = get(
                width,
                `${displayMode}.value`,
                fallbackValue
            );
        }
    });

    return style;
};
