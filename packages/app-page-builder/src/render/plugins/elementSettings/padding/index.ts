import { get } from "lodash";
import {
    PbElementDataSettingsPaddingUnitType,
    PbRenderElementStylePlugin
} from "@webiny/app-page-builder/types";

const validateSpacingValue = value => {
    return value || 0;
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

            const desktopUnit: PbElementDataSettingsPaddingUnitType = adv
                ? get(desktop, "units." + side, "px")
                : get(desktop, "units.all", "px");
            const mobileUnit: PbElementDataSettingsPaddingUnitType = adv
                ? get(mobile, "units." + side, "px")
                : get(mobile, "units.all", "px");

            style[`--desktop-padding-${side}`] = validateSpacingValue(desktopValue) + desktopUnit;
            style[`--mobile-padding-${side}`] = validateSpacingValue(mobileValue) + mobileUnit;
        });

        return style;
    }
} as PbRenderElementStylePlugin;
