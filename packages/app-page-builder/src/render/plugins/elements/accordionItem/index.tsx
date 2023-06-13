import { PbRenderElementPlugin } from "~/types";
import { createAccordionItem } from "@webiny/app-page-builder-elements/renderers/accordionItem";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? () => <></>
    : createAccordionItem();

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-accordion-item",
        elementType: "accordion-item",
        render
    };
};
