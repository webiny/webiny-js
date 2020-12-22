import get from "lodash/get";
import { PbRenderElementStylePlugin } from "@webiny/app-page-builder/types";

export default {
    name: "pb-render-page-element-style-text",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { color } = get(element, "data.text", {});

        if (!color) {
            return style;
        }

        return { ...style, color: color };
    }
} as PbRenderElementStylePlugin;
