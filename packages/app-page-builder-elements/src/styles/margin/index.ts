import { get } from "lodash";
import kebabCase from "lodash/kebabCase";
import applyPerDeviceStyleWithFallback from "~/utils/applyPerDeviceStyleWithFallback";

const validateSpacingValue = value => {
    if (!value) {
        return "0px";
    }
    if (value.includes("auto")) {
        return "auto";
    }

    return value;
};

export default ({ displayModes, element, style }) => {
    const { margin } = get(element, "data.settings", {});

    ["top", "right", "bottom", "left"].forEach(side => {
        // Set per-device property value
        applyPerDeviceStyleWithFallback({
            displayModes,
            applyStyle: ({ displayMode, fallbackMode }) => {
                const fallbackMarginValue = get(
                    style,
                    `--${kebabCase(fallbackMode)}-margin-${side}`
                );
                const adv = get(margin, `${displayMode}.advanced`, false);
                const value = adv
                    ? get(margin, `${displayMode}.${side}`, fallbackMarginValue)
                    : get(margin, `${displayMode}.all`, fallbackMarginValue);
                style[`--${kebabCase(displayMode)}-margin-${side}`] = validateSpacingValue(value);
            }
        });
    });

    return style;
};
