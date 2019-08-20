// @flow
import React from "react";
import Document from "./Document";
import type { PbElementPluginType } from "webiny-app-page-builder/types";

export default (): PbElementPluginType => {
    return {
        name: "pb-render-page-element-document",
        type: "pb-render-page-element",
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
