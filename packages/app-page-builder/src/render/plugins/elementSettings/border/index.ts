import { get, startCase, upperFirst } from "lodash";
import { PbRenderElementStylePlugin } from "@webiny/app-page-builder/types";

const borderRadiusSides = ["topLeft", "topRight", "bottomLeft", "bottomRight"];
const boxSides = ["top", "right", "bottom", "left"];

export default {
    name: "pb-render-page-element-style-border",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { border } = get(element, "data.settings", {});
        if (!border) {
            return style;
        }

        boxSides.forEach((side, index) => {
            const Side = startCase(side);
            style[`border${Side}Style`] = border.style;
            style[`border${Side}Color`] = border.color;
            // Set "border-width".
            const allSideWidth = border?.width?.all;
            style[`border${Side}Width`] =
                ((allSideWidth ? allSideWidth : border?.width?.[side]) || 0) + "px";
            // Set "border-radius".
            const borderRadiusSide = borderRadiusSides[index];
            const BorderRadiusSide = upperFirst(borderRadiusSide);
            const allSideRadius = border?.radius?.all;
            style[`border${BorderRadiusSide}Radius`] =
                ((allSideRadius ? allSideRadius : border?.radius?.[borderRadiusSide]) || 0) + "px";
        });

        return style;
    }
} as PbRenderElementStylePlugin;
