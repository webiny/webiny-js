import { ButtonRenderer } from "@webiny/app-page-builder-elements/renderers/button";
import { PbRenderElementPlugin } from "~/types";

export default () => {
    return [
        {
            name: `pb-render-page-element-button`,
            type: "pb-render-page-element",
            elementType: "button",
            render: ButtonRenderer
        } as PbRenderElementPlugin
    ];
};
