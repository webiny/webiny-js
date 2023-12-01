import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import camelCase from "lodash/camelCase";
import { PbRenderElementStylePlugin } from "../../../../types";
import { applyPerDeviceStyleWithFallback } from "../../../utils";

const borderRadiusSides = ["top-left", "top-right", "bottom-left", "bottom-right"];
const boxSides = ["top", "right", "bottom", "left"];

const removeUnitFromEnd = (value: string, unit = "px"): string => {
    if (value) {
        return value.replace(unit, "");
    }
    return value;
};

export default {
    name: "pb-render-page-element-style-border",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { border } = get(element, "data.settings", {});

        // Set "per-side" border style
        boxSides.forEach((side, index) => {
            // Set per-device property value
            applyPerDeviceStyleWithFallback(({ displayMode, fallbackMode }) => {
                // Set "border style"
                style[`--${kebabCase(displayMode)}-border-${side}-style`] = get(
                    border,
                    `${displayMode}.style`,
                    get(style, `--${kebabCase(fallbackMode)}-border-${side}-style`)
                );
                // Set "border-color"
                style[`--${kebabCase(displayMode)}-border-${side}-color`] = get(
                    border,
                    `${displayMode}.color`,
                    get(style, `--${kebabCase(fallbackMode)}-border-${side}-color`)
                );
                // Set "border-width"
                const advancedWidth = get(border, `${displayMode}.width.advanced`, false);
                const fallbackWidthValue = get(
                    style,
                    `--${kebabCase(fallbackMode)}-border-${side}-width`,
                    0
                );
                const allWidth = get(
                    border,
                    `${displayMode}.width.all`,
                    removeUnitFromEnd(fallbackWidthValue)
                );
                const sideWidth = get(
                    border,
                    `${displayMode}.width.${side}`,
                    removeUnitFromEnd(fallbackWidthValue)
                );
                style[`--${kebabCase(displayMode)}-border-${side}-width`] =
                    (advancedWidth ? sideWidth : allWidth) + "px";
                // Set "border-radius".
                const advancedRadius = get(border, `${displayMode}.radius.advanced`, false);
                const borderRadiusSide = borderRadiusSides[index];
                const fallbackRadiusValue = get(
                    style,
                    `--${kebabCase(fallbackMode)}-border-${kebabCase(borderRadiusSide)}-radius`,
                    0
                );
                const allRadius = get(
                    border,
                    `${displayMode}.radius.all`,
                    removeUnitFromEnd(fallbackRadiusValue)
                );
                const sideRadius = get(
                    border,
                    `${displayMode}.radius.${camelCase(borderRadiusSide)}`,
                    removeUnitFromEnd(fallbackRadiusValue)
                );
                style[`--${kebabCase(displayMode)}-border-${kebabCase(borderRadiusSide)}-radius`] =
                    (advancedRadius ? sideRadius : allRadius) + "px";
            });
        });

        return style;
    }
} as PbRenderElementStylePlugin;
