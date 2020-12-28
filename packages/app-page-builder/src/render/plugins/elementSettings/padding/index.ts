import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import { plugins } from "@webiny/plugins";
import { PbRenderResponsiveModePlugin, PbRenderElementStylePlugin } from "../../../../types";

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
        // Get editor modes
        const editorModes = plugins
            .byType<PbRenderResponsiveModePlugin>("pb-render-responsive-mode")
            .map(pl => pl.config);
        // Set per side padding value
        ["top", "right", "bottom", "left"].forEach(side => {
            // Set per-device property value
            editorModes.forEach(({ name: deviceName }) => {
                const adv = get(padding, `${deviceName}.advanced`, false);
                const value = adv
                    ? get(padding, `${deviceName}.${side}`)
                    : get(padding, `${deviceName}.all`);
                style[`--${kebabCase(deviceName)}-padding-${side}`] = validateSpacingValue(value);
            });
        });

        return style;
    }
} as PbRenderElementStylePlugin;
