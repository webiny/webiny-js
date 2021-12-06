import React from "react";
import Document from "./Document";
import { PbEditorPageElementPlugin, PbEditorElement } from "../../../../types";

export default () => {
    return new PbEditorPageElementPlugin({
        name: "pb-editor-page-element-document",
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
            return <Document element={element as unknown as PbEditorElement} />;
        }
    });
};
