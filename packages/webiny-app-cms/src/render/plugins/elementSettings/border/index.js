// @flow
import { get, startCase } from "lodash";
import type { CmsRenderElementStylePluginType } from "webiny-app-cms/types";

export default ({
    name: "pb-render-element-style-border",
    type: "pb-render-element-style",
    renderStyle({ element, style }) {
        const { border } = get(element, "data.settings", {});
        if (!border) {
            return style;
        }

        if (border.radius) {
            style.borderRadius = border.radius;
        }

        ["top", "right", "bottom", "left"].forEach(side => {
            let sideEnabled = get(border, `borders.${side}`);
            if (typeof sideEnabled === "undefined") {
                sideEnabled = true;
            }

            if (sideEnabled) {
                const Side = startCase(side);
                style[`border${Side}Style`] = border.style;
                style[`border${Side}Color`] = border.color;
                style[`border${Side}Width`] = border.width;
            }
        });

        return style;
    }
}: CmsRenderElementStylePluginType);
