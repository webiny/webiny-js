import { PbRenderElementPlugin } from "~/types";
import { createCarousel } from "@webiny/app-page-builder-elements/renderers/carousel";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine ? () => <></> : createCarousel();

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-carousel",
        elementType: "carousel",
        render
    };
};