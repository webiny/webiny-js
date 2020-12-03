import { get } from "lodash";
import {
    PbElementDataSettingsMarginUnitType,
    PbRenderElementStylePlugin
} from "@webiny/app-page-builder/types";

const validateSpacingValue = (value, unit) => {
    if (unit === "auto") {
        return "";
    }
    return value || 0;
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

            const desktopUnit: PbElementDataSettingsMarginUnitType = adv
                ? get(desktop, "units." + side, "px")
                : get(desktop, "units.all", "px");
            const mobileUnit: PbElementDataSettingsMarginUnitType = adv
                ? get(mobile, "units." + side, "px")
                : get(mobile, "units.all", "px");

            style[`--desktop-margin-${side}`] =
                validateSpacingValue(desktopValue, desktopUnit) + desktopUnit;
            style[`--mobile-margin-${side}`] =
                validateSpacingValue(mobileValue, mobileUnit) + mobileUnit;
        });

        return style;
    }
} as PbRenderElementStylePlugin;
