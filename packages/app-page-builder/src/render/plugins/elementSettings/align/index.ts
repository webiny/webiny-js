import { get } from "lodash";
import { PbRenderElementStylePlugin } from "@webiny/app-page-builder/types";

const vertical = {
    start: "flex-start",
    center: "center",
    end: "flex-end"
};

const TEXT_ALIGN = {
    horizontalLeft: "left",
    horizontalCenter: "center",
    horizontalRight: "right"
};

const plugins: PbRenderElementStylePlugin[] = [
    {
        name: "pb-render-page-element-style-horizontal-align",
        type: "pb-render-page-element-style",
        renderStyle({ element, style }) {
            const { horizontalAlign } = get(element, "data.settings", {});
            if (!horizontalAlign) {
                return style;
            }
            return { ...style, textAlign: horizontalAlign };
        }
    },
    {
        name: "pb-render-page-element-style-horizontal-align-flex",
        type: "pb-render-page-element-style",
        renderStyle({ element, style }) {
            const { horizontalAlignFlex } = get(element, "data.settings", {});
            if (!horizontalAlignFlex) {
                return style;
            }
            return { ...style, alignItems: horizontalAlignFlex };
        }
    },
    {
        name: "pb-render-page-element-style-vertical-align",
        type: "pb-render-page-element-style",
        renderStyle({ element, style }) {
            const { verticalAlign } = get(element, "data.settings", {});
            if (!verticalAlign) {
                return style;
            }
            return { ...style, justifyContent: vertical[verticalAlign] };
        }
    },
    {
        name: "pb-render-page-element-style-alignment",
        type: "pb-render-page-element-style",
        renderStyle({ element, style }) {
            const { alignment } = get(element, "data.settings", {});
            if (!alignment) {
                return style;
            }
            return { ...style, textAlign: TEXT_ALIGN[alignment] };
        }
    }
];

export default plugins;
