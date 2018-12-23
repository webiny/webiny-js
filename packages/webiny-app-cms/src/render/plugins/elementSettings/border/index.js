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

        if (border.style) {
            style.borderStyle = border.style;
        }

        if (border.width) {
            style.borderWidth = border.width;
        }

        if (border.radius) {
            style.borderRadius = border.radius;
        }

        if (border.color) {
            style.borderColor = border.color;
        }
        
        return style;
    }
}: CmsRenderElementStylePluginType);
