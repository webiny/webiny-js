import React from "react";
import Document from "./Document";
import { PbElementPlugin } from "@webiny/app-page-builder/admin/types";

export default (): PbElementPlugin => {
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
