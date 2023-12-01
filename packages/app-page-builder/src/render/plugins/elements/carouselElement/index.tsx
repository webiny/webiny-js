import { PbRenderElementPlugin } from "~/types";
import { createCarouselElement } from "@webiny/app-page-builder-elements/renderers/carouselElement";

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-carousel-element",
        elementType: "carousel-element",
        render: createCarouselElement()
    };
};
