import { PbRenderElementPlugin } from "~/types";
import { createDocument } from "@webiny/app-page-builder-elements/renderers/document";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-document",
        type: "pb-render-page-element",
        elementType: "document",
        render: createDocument()
    };
};
