import { get } from "lodash";
import { PbRenderElementStylePlugin } from "@webiny/app-page-builder/types";

const validateSpacingValue = value => {
    const parsedValue = parseInt(value);
    if (Number.isNaN(parsedValue)) {
        return "0px";
    }
    return value;
};

export default {
    name: "pb-render-page-element-style-padding",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { padding } = get(element, "data.settings", {});

        if (!padding) {
            return style;
        }

        const adv = padding.advanced;
        const { desktop = {}, mobile = {} } = padding;

        ["top", "right", "bottom", "left"].forEach(side => {
            const desktopValue = adv ? desktop[side] : desktop.all;
            const mobileValue = adv ? mobile[side] : mobile.all;

            style[`--desktop-padding-${side}`] = validateSpacingValue(desktopValue);
            style[`--mobile-padding-${side}`] = validateSpacingValue(mobileValue);
        });

        return style;
    }
} as PbRenderElementStylePlugin;
