// @flow
import { get } from "lodash";
import type { CmsRenderElementStylePluginType } from "webiny-app-cms/types";

export default ({
    name: "pb-render-element-style-width",
    type: "pb-render-element-style",
    renderStyle({ element, style }) {
        const { width } = get(element, "data.settings", {});

        if (!width) {
            return style;
        }

        return { ...style, width: width.value };
    }
}: CmsRenderElementStylePluginType);
