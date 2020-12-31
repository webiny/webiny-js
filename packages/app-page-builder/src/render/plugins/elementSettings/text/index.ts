import get from "lodash/get";
import { PbRenderElementStylePlugin } from "@webiny/app-page-builder/types";

export default {
    name: "pb-render-page-element-style-text",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { color, alignment } = get(element, "data.text", {});
        const newStyle = { ...style };

        if (color) {
            newStyle["color"] = color;
        }

        if (alignment) {
            newStyle["textAlign"] = alignment;
        }

        return newStyle;
    }
} as PbRenderElementStylePlugin;
