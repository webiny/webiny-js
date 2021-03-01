import React from "react";
import Cell from "./Cell";
import { PbRenderElementPlugin } from "../../../../types";

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
