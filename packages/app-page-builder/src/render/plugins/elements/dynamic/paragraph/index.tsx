import React from "react";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import Paragraph from "./Paragraph";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-dynamic-paragraph",
        type: "pb-render-page-element",
        elementType: "dynamic-paragraph",
        render(props) {
            return <Paragraph {...props} />;
        }
    };
};
