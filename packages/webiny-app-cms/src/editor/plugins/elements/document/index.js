// @flow
import React from "react";
import Document from "./Document";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): ElementPluginType => {
    return {
        name: "pb-page-element-document",
        type: "pb-page-element",
        elementType: "document",
        create(options = {}) {
            return {
                type: "pb-page-element-document",
                elements: [],
                ...options
            };
        },
        render({ element }) {
            return <Document element={element} />;
        }
    };
};
