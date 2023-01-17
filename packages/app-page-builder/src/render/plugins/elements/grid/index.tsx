import Grid from "./Grid";
import { PbRenderElementPlugin } from "~/types";
import { createGrid } from "@webiny/app-page-builder-elements/renderers/grid";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine ? props => <Grid {...props} /> : createGrid();

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-grid",
        elementType: "grid",
        render
    };
};
