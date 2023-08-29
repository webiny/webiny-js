import { PbRenderElementPlugin } from "~/types";
import { DynamicSourceProvider } from "@webiny/app-dynamic-pages/contexts/DynamicSource";
import { createCarousel } from "@webiny/app-page-builder-elements/renderers/carousel";

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-carousel",
        elementType: "carousel",
        render: createCarousel({ dynamicSourceProvider: DynamicSourceProvider })
    };
};
