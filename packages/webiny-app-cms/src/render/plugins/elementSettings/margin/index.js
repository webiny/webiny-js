// @flow
import type { CmsRenderElementStylePluginType } from "webiny-app-cms/types";

export default ({
    name: "cms-render-element-style-margin",
    type: "cms-render-element-style",
    renderStyle({ settings, style }: Object) {
        const { margin } = settings;
        if (!margin) {
            return style;
        }

        if (margin.advanced) {
            return {
                ...style,
                marginTop: margin.top || 0,
                marginRight: margin.right || 0,
                marginBottom: margin.bottom || 0,
                marginLeft: margin.left || 0
            };
        }

        return { ...style, margin: margin.all };
    }
}: CmsRenderElementStylePluginType);
