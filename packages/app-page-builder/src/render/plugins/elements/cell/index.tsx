import React from "react";
import Cell from "./Cell";
import { PbRenderElementPlugin } from "~/types";
import { createCell } from "@webiny/app-page-builder-elements/renderers/cell";
import { isLegacyRenderingEngine } from "~/utils";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine ? Cell : createCell();

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-cell",
        elementType: "cell",
        render
    };
};
