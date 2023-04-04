import Accordion from "./Accordion";
import { PbRenderElementPlugin } from "~/types";
import { createAccordion } from "@webiny/app-page-builder-elements/renderers/accordion";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? props => <Accordion {...props} />
    : createAccordion();

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-accordion",
        elementType: "accordion",
        render
    };
};
