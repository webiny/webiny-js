import React from "react";
import Block from "./Block";
import { PbRenderElementPlugin } from "../../../../types";
import { createBlock } from "@webiny/app-page-builder-elements/renderers/block";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-block",
        type: "pb-render-page-element",
        elementType: "block",
        renderer: createBlock(),
        render(props) {
            return <Block {...props} />;
        }
    };
};
