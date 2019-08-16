// @flow
import { get } from "lodash";
import type { CmsRenderElementStylePluginType } from "webiny-app-cms/types";

export default ({
    name: "pb-render-element-style-height",
    type: "pb-render-element-style",
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
}: CmsRenderElementStylePluginType);
