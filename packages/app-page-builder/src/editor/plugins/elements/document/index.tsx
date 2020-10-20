import React from "react";
import Document from "./Document";
import { PbEditorPageElementPlugin, PbShallowElement } from "@webiny/app-page-builder/types";

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
            // TODO figure out if we can change this on the plugin type level
            return <Document element={element as unknown as PbShallowElement} />;
        }
    };
};
