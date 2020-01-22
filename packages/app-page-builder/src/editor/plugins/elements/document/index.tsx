import React from "react";
import Document from "./Document";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/admin/types";

export default (): PbEditorPageElementPlugin => {
    return {
        name: "pb-editor-page-element-document",
        type: "pb-editor-page-element",
        elementType: "document",
        create(options = {}) {
            return {
                type: "document",
                elements: [],
                ...options
            };
        },
        render({ element }) {
            return <Document element={element} />;
        }
    };
};
