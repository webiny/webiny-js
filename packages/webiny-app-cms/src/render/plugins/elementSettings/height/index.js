// @flow
import { get } from "lodash";
import type { CmsRenderElementStylePluginType } from "webiny-app-cms/types";

export default ({
    name: "cms-render-element-style-height",
    type: "cms-render-element-style",
    renderStyle({ element, style }) {
        const { height } = get(element, "data.settings", {});
        if (!height) {
            return style;
        }

        if (height.fullHeight) {
            // If `fullHeight=true`, we completely ignore the height value.
            style.height = "100vh";
        } else {
            style.height = height.value;
        }

        return style;
    }
}: CmsRenderElementStylePluginType);
