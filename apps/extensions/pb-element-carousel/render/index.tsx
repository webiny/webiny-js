import React from "react";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import CarouselGrid from "./components/CarouselGrid";

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-carousel",
        elementType: "carousel",
        render(props) {
            return <CarouselGrid {...props} />;
        }
    };
};
