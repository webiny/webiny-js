// @flow
import React from "react";
import Document from "./Document";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): ElementPluginType => {
    return {
        name: "pb-render-element-document",
        type: "pb-render-element",
        elementType: "document",
        create(options = {}) {
            return {
                type: "pb-page-element-document",
                elements: [],
                ...options
            };
        },
        render(props) {
            return <Document {...props} />;
        }
    };
};
