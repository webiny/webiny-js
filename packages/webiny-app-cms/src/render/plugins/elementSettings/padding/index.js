// @flow
import { get } from "lodash";
import type { CmsRenderElementStylePluginType } from "webiny-app-cms/types";

export default ({
    name: "cms-render-element-style-padding",
    type: "cms-render-element-style",
    renderStyle({ element, style }) {
        const { padding } = get(element, "data.settings", {});

        if (!padding) {
            return style;
        }

        const adv = padding.advanced;
        const { desktop = {}, mobile = {} } = padding;

        ["top", "right", "bottom", "left"].forEach(side => {
            style[`--desktop-padding-${side}`] = ((adv ? desktop[side] : desktop.all) || 0) + "px";
            style[`--mobile-padding-${side}`] = ((adv ? mobile[side] : mobile.all) || 0) + "px";
        });

        return style;
    }
}: CmsRenderElementStylePluginType);
