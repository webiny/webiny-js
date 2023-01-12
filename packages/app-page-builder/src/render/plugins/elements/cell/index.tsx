import React from "react";
import Cell from "./Cell";
import { PbRenderElementPlugin } from "../../../../types";
import { createCell } from "@webiny/app-page-builder-elements/renderers/cell";

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-cell",
        elementType: "cell",
        renderer: createCell(),
        render(props) {
            return <Cell {...props} />;
        }
    };
};
