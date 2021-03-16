import React from "react";
import Block from "./Block";
import { PbRenderElementPlugin } from "../../../../types";

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
