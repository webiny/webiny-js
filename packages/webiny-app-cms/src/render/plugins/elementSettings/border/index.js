// @flow
import type { CmsRenderElementStylePluginType } from "webiny-app-cms/types";

export default ({
    name: "cms-render-element-style-border",
    type: "cms-render-element-style",
    renderStyle({ settings, style }: Object) {
        const { border } = settings;
        if (!border) {
            return style;
        }

        if (border.radius) {
            style.borderRadius = border.radius;
        }

        ["top", "right", "bottom", "left"].forEach(side => {
            if (border.borders[side]) {
                style[`border-${side}-style`] = border.style;
                style[`border-${side}-color`] = border.color;
                style[`border-${side}-width`] = border.width;
            }
        });

        return style;
    }
}: CmsRenderElementStylePluginType);
