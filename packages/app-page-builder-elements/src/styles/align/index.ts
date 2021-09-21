import { get } from "lodash";
import kebabCase from "lodash/kebabCase";
import applyPerDeviceStyleWithFallback from "~/utils/applyPerDeviceStyleWithFallback";

function setHorizontalAlign({ element, style }) {
    const { horizontalAlign } = get(element, "data.settings", {});
    if (!horizontalAlign) {
        return style;
    }
    return { ...style, textAlign: horizontalAlign };
}

function setHorizontalAlignFlex({ displayModes, element, style }) {
    const { horizontalAlignFlex } = get(element, "data.settings", {});

    // Set per-device property value
    applyPerDeviceStyleWithFallback({
        displayModes,
        applyStyle: ({ displayMode, fallbackMode }) => {
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
        }
    });

    return style;
}

function setVerticalAlign({ displayModes, element, style }) {
    const { verticalAlign } = get(element, "data.settings", {});

    // Set per-device property value
    applyPerDeviceStyleWithFallback({
        displayModes,
        applyStyle: ({ displayMode, fallbackMode }) => {
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
        }
    });

    return style;
}

export default ({ displayModes, element, style }) => {
    style = setHorizontalAlign({ element, style });
    style = setHorizontalAlignFlex({ displayModes, element, style });
    style = setVerticalAlign({ displayModes, element, style });

    return style;
};
