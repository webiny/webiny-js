// @flow
import { get } from "lodash";
import type { PbRenderElementStylePluginType } from "webiny-app-page-builder/types";

export default ({
    name: "pb-render-page-element-style-width",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { width } = get(element, "data.settings", {});

        if (!width) {
            return style;
        }

        return { ...style, width: width.value };
    }
}: PbRenderElementStylePluginType);
