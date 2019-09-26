// @flow
import React from "react";
import Document from "./Document";
import type { PbElementPluginType } from "@webiny/app-page-builder/types";

export default (): PbElementPluginType => {
    return {
        name: "pb-page-element-document",
        type: "pb-page-element",
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
