// @flow
import type { CmsRenderElementStylePluginType } from "webiny-app-cms/types";

export default ({
    name: "cms-render-element-style-padding",
    type: "cms-render-element-style",
    renderStyle({ settings, style }: Object) {
        const { padding } = settings;
        if (!padding) {
            return style;
        }

        if (padding.advanced) {
            return {
                ...style,
                paddingTop: padding.top || 0,
                paddingRight: padding.right || 0,
                paddingBottom: padding.bottom || 0,
                paddingLeft: padding.left || 0
            };
        }

        return { ...style, padding: padding.all };
    }
}: CmsRenderElementStylePluginType);
