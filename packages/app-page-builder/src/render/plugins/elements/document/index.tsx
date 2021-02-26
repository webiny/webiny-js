import React from "react";
import Document from "./Document";
import { PbRenderElementPlugin } from "../../../../types";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-document",
        type: "pb-render-page-element",
        elementType: "document",
        render(props) {
            return <Document {...props} />;
        }
    };
};
