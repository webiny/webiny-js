import React from "react";
import Document from "./Document";
import { PbRenderElementPlugin } from "../../../../types";
import { createDocument } from "@webiny/app-page-builder-elements/renderers/document";

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-document",
        type: "pb-render-page-element",
        elementType: "document",
        renderer: createDocument(),
        render(props) {
            return <Document {...props} />;
        }
    };
};
