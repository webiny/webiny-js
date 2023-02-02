import Document from "./Document";
import { PbRenderElementPlugin } from "~/types";
import { createDocument } from "@webiny/app-page-builder-elements/renderers/document";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? props => <Document {...props} />
    : createDocument();

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-document",
        type: "pb-render-page-element",
        elementType: "document",
        render
    };
};
