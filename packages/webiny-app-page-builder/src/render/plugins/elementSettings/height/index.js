// @flow
import { get } from "lodash";
import type { PbRenderElementStylePluginType } from "webiny-app-page-builder/types";

export default ({
    name: "pb-render-page-element-style-height",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { height } = get(element, "data.settings", {});
        if (!height) {
            return style;
        }

        if (height.fullHeight) {
            // If `fullHeight=true`, we completely ignore the height value.
            style.minHeight = "100vh";
        } else {
            style.height = height.value;
        }

        return style;
    }
}: PbRenderElementStylePluginType);
