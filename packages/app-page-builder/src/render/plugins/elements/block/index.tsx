import React from "react";
import Block from "./Block";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-block",
        type: "pb-render-page-element",
        elementType: "block",
        render(props) {
            return <Block {...props} />;
        }
    };
};
