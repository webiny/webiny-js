import get from "lodash/get";
import { PbRenderElementStylePlugin } from "../../../../types";

export default {
    name: "pb-render-page-element-style-shadow",
    type: "pb-render-page-element-style",
    renderStyle({ element, style }) {
        const { shadow } = get(element, "data.settings", {});
        if (!shadow) {
            return {
                ...style,
                "--box-shadow": "none"
            };
        }

        return {
            ...style,
            "--box-shadow": [
                (shadow.horizontal || 0) + "px",
                (shadow.vertical || 0) + "px",
                (shadow.blur || 0) + "px",
                (shadow.spread || 0) + "px",
                shadow.color || "#000"
            ].join(" ")
        };
    }
} as PbRenderElementStylePlugin;
