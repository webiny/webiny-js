import Grid from "./Grid";
import { PbRenderElementPlugin } from "~/types";
import { createGrid } from "@webiny/app-page-builder-elements/renderers/grid";
import { isLegacyRenderingEngine } from "~/utils";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine ? Grid : createGrid();

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-grid",
        elementType: "grid",
        render
    };
};
