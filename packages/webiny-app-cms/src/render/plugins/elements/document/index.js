// @flow
import React from "react";
import Document from "./Document";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): ElementPluginType => {
    return {
        name: "cms-render-element-document",
        type: "cms-render-element",
        element: "cms-element-document",
        create(options = {}) {
            return {
                type: "cms-element-document",
                elements: [],
                ...options
            };
        },
        render(props) {
            return <Document {...props} />;
        }
    };
};
