// @flow
import React from "react";
import Document from "./Document";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): ElementPluginType => {
    return {
        name: "cms-element-document",
        type: "cms-element",
        create(options = {}) {
            return {
                type: "cms-element-document",
                elements: [],
                ...options
            };
        },
        render({ element }) {
            return <Document element={element} />;
        }
    };
};
