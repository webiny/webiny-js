import { PbRenderElementPlugin } from "~/types";
import { BlockRenderer } from "@webiny/app-page-builder-elements/renderers/block";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-block",
        type: "pb-render-page-element",
        elementType: "block",
        render: BlockRenderer
    };
};
