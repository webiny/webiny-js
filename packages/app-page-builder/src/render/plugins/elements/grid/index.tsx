import React from "react";
import { PbRenderElementPlugin } from "~/types";
import { createGrid } from "@webiny/app-page-builder-elements/renderers/grid";

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-grid",
        elementType: "grid",
        render: createGrid()
    };
};
