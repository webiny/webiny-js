// @flow
import type { CmsRenderElementStylePluginType } from "webiny-app-cms/types";

const vertical = {
    start: "flex-start",
    center: "center",
    end: "flex-end"
};

export default ([
    {
        name: "cms-render-element-style-horizontal-align",
        type: "cms-render-element-style",
        renderStyle({ settings, style }: Object) {
            const { horizontalAlign } = settings;
            if (!horizontalAlign) {
                return style;
            }
            return { ...style, textAlign: horizontalAlign };
        }
    },
    {
        name: "cms-render-element-style-horizontal-align-flex",
        type: "cms-render-element-style",
        renderStyle({ settings, style }: Object) {
            const { horizontalAlignFlex } = settings;
            if (!horizontalAlignFlex) {
                return style;
            }
            return { ...style, alignItems: horizontalAlignFlex };
        }
    },
    {
        name: "cms-render-element-style-vertical-align",
        type: "cms-render-element-style",
        renderStyle({ settings, style }: Object) {
            const { verticalAlign } = settings;
            if (!verticalAlign) {
                return style;
            }
            return { ...style, justifyContent: vertical[verticalAlign] };
        }
    }
]: Array<CmsRenderElementStylePluginType>);
