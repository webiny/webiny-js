import { get } from "lodash";
import kebabCase from "lodash/kebabCase";
import applyPerDeviceStyleWithFallback from "~/utils/applyPerDeviceStyleWithFallback";

const validateSpacingValue = value => {
    const parsedValue = parseInt(value);
    if (Number.isNaN(parsedValue)) {
        return "0px";
    }
    return value;
};

export default ({ displayModes, element, style }) => {
    const { padding } = get(element, "data.settings", {});

    // Set per side padding value
    ["top", "right", "bottom", "left"].forEach(side => {
        // Set per-device property value
        applyPerDeviceStyleWithFallback({
            displayModes,
            applyStyle: ({ displayMode, fallbackMode }) => {
                const fallbackPaddingValue = get(
                    style,
                    `--${kebabCase(fallbackMode)}-padding-${side}`
                );
                const adv = get(padding, `${displayMode}.advanced`, false);
                const value = adv
                    ? get(padding, `${displayMode}.${side}`, fallbackPaddingValue)
                    : get(padding, `${displayMode}.all`, fallbackPaddingValue);
                style[`--${kebabCase(displayMode)}-padding-${side}`] = validateSpacingValue(value);
            }
        });
    });

    return style;
};
