// @flow
import { get } from "lodash";
import type { PbRenderElementStylePluginType } from "@webiny/app-page-builder/types";

export default ({
    name: "pb-render-page-element-style-shadow",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }: Object) {
        const { shadow } = get(element, "data.settings", {});
        if (!shadow) {
            return style;
        }

        return {
            ...style,
            boxShadow: [
                (shadow.horizontal || 0) + "px",
                (shadow.vertical || 0) + "px",
                (shadow.blur || 0) + "px",
                (shadow.spread || 0) + "px",
                shadow.color || "#000"
            ].join(" ")
        };
    }
}: PbRenderElementStylePluginType);
