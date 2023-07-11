import { PbRenderElementPlugin } from "~/types";
import { createAccordion } from "@webiny/app-page-builder-elements/renderers/accordion";

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-accordion",
        elementType: "accordion",
        render: createAccordion()
    };
};
