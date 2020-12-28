import get from "lodash/get";
import kebabCase from "lodash/kebabCase";
import { plugins } from "@webiny/plugins";
import { PbRenderResponsiveModePlugin, PbRenderElementStylePlugin } from "../../../../types";

const validateSpacingValue = value => {
    if (!value) {
        return "0px";
    }
    if (value.includes("auto")) {
        return "auto";
    }

    return value;
};

export default {
    name: "pb-render-page-element-style-margin",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { margin } = get(element, "data.settings", {});

        if (!margin) {
            return style;
        }

        // Get editor modes
        const editorModes = plugins
            .byType<PbRenderResponsiveModePlugin>("pb-render-responsive-mode")
            .map(pl => pl.config);

        ["top", "right", "bottom", "left"].forEach(side => {
            // Set per-device property value
            editorModes.forEach(({ displayMode }) => {
                const adv = get(margin, `${displayMode}.advanced`, false);
                const value = adv
                    ? get(margin, `${displayMode}.${side}`)
                    : get(margin, `${displayMode}.all`);
                style[`--${kebabCase(displayMode)}-margin-${side}`] = validateSpacingValue(value);
            });
        });

        return style;
    }
} as PbRenderElementStylePlugin;
