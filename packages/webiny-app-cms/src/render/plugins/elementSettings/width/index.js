// @flow
import type { CmsRenderElementStylePluginType } from "webiny-app-cms/types";

export default ({
    name: "cms-render-element-style-width",
    type: "cms-render-element-style",
    renderStyle({ settings, style }: Object) {
        const { width } = settings;
        if (!width) {
            return style;
        }

        return { ...style, width: width.value };
    }
}: CmsRenderElementStylePluginType);
