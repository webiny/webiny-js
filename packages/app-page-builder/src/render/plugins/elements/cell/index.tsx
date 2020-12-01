import React from "react";
import Cell from "./Cell";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-cell",
        elementType: "cell",
        render(props) {
            return <Cell {...props} />;
        }
    };
};
