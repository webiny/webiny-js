import React from "react";
import { PbRenderElementPlugin } from "../../../../types";
import Quote from "./Quote";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-quote",
        type: "pb-render-page-element",
        elementType: "quote",
        render(props) {
            return <Quote {...props} />;
        }
    };
};
