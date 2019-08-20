// @flow
import { get } from "lodash";
import type { PbRenderElementStylePluginType } from "webiny-app-page-builder/types";

export default ({
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
            style[`--desktop-margin-${side}`] = ((adv ? desktop[side] : desktop.all) || 0) + "px";
            style[`--mobile-margin-${side}`] = ((adv ? mobile[side] : mobile.all) || 0) + "px";
        });

        return style;
    }
}: PbRenderElementStylePluginType);
