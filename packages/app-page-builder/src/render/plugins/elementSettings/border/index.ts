import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import {
    PbRenderElementStylePlugin,
    PbRenderResponsiveModePlugin
} from "@webiny/app-page-builder/types";
import { plugins } from "@webiny/plugins";

const borderRadiusSides = ["top-left", "top-right", "bottom-left", "bottom-right"];
const boxSides = ["top", "right", "bottom", "left"];

export default {
    name: "pb-render-page-element-style-border",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { border } = get(element, "data.settings", {});
        if (!border) {
            return style;
        }

        // Get display modes
        const displayModeConfigs = plugins
            .byType<PbRenderResponsiveModePlugin>("pb-render-responsive-mode")
            .map(pl => pl.config);

        // Set "per-side" border style
        boxSides.forEach((side, index) => {
            // Set "per-device" property value
            displayModeConfigs.forEach(({ displayMode }) => {
                style[`--${kebabCase(displayMode)}-border-${side}-style`] = get(
                    border,
                    `${displayMode}.style`
                );
                style[`--${kebabCase(displayMode)}-border-${side}-color`] = get(
                    border,
                    `${displayMode}.color`
                );
                // Set "border-width".
                const allWidth = get(border, `${displayMode}.width.all`, 0);
                const sideWidth = get(border, `${displayMode}.width.${side}`, 0);
                style[`--${kebabCase(displayMode)}-border-${side}-width`] =
                    (allWidth ? allWidth : sideWidth) + "px";
                // Set "border-radius".
                const borderRadiusSide = borderRadiusSides[index];
                const allRadius = get(border, `${displayMode}.radius.all`, 0);
                const sideRadius = get(border, `${displayMode}.radius.${side}`, 0);
                style[`--${kebabCase(displayMode)}-border-${kebabCase(borderRadiusSide)}-radius`] =
                    (allRadius ? allRadius : sideRadius) + "px";
            });
        });

        return style;
    }
} as PbRenderElementStylePlugin;
