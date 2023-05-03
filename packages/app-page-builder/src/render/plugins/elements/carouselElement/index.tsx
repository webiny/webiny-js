import { PbRenderElementPlugin } from "~/types";
import { createCarouselElement } from "@webiny/app-page-builder-elements/renderers/carouselElement";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine ? () => <></> : createCarouselElement();

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-carousel-element",
        elementType: "carousel-element",
        render
    };
};