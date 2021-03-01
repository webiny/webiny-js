import React from "react";
import Paragraph from "./Paragraph";
import { PbRenderElementPlugin } from "../../../../types";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-paragraph",
        type: "pb-render-page-element",
        elementType: "paragraph",
        render(props) {
            return <Paragraph {...props} />;
        }
    };
};
