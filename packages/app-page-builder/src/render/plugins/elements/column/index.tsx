import React from "react";
import Column from "./Column";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-column",
        type: "pb-render-page-element",
        elementType: "column",
        render(props) {
            return <Column {...props} />;
        }
    };
};
