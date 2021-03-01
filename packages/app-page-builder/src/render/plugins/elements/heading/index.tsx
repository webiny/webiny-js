import React from "react";
import Heading from "./Heading";
import { PbRenderElementPlugin } from "../../../../types";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-heading",
        type: "pb-render-page-element",
        elementType: "heading",
        render(props) {
            return <Heading {...props} />;
        }
    };
};
