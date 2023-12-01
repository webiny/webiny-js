import { PbRenderElementPlugin } from "~/types";
import { createAccordionItem } from "@webiny/app-page-builder-elements/renderers/accordionItem";

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-accordion-item",
        elementType: "accordion-item",
        render: createAccordionItem()
    };
};
