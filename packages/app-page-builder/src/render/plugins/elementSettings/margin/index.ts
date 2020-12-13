import { get } from "lodash";
import { PbRenderElementStylePlugin } from "@webiny/app-page-builder/types";

const validateSpacingValue = value => {
    return value || "0px";
};

export default {
    name: "pb-render-page-element-style-margin",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { margin } = get(element, "data.settings", {});

        if (!margin) {
            return style;
        }

        const adv = margin.advanced;
        const { desktop = {}, mobile = {} } = margin;

        ["top", "right", "bottom", "left"].forEach(side => {
            const desktopValue = adv ? desktop[side] : desktop.all;
            const mobileValue = adv ? mobile[side] : mobile.all;

            style[`--desktop-margin-${side}`] = validateSpacingValue(desktopValue);
            style[`--mobile-margin-${side}`] = validateSpacingValue(mobileValue);
        });

        return style;
    }
} as PbRenderElementStylePlugin;
