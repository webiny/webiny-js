import React from "react";
import Document from "./Document";
import { PbRenderElementPlugin } from "~/types";
import { createDocument } from "@webiny/app-page-builder-elements/renderers/document";
import { isLegacyRenderingEngine } from "~/utils";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? Document
    : createDocument();

export default (): PbRenderElementPlugin => {
    return {
        name: "pb-render-page-element-document",
        type: "pb-render-page-element",
        elementType: "document",
        render
    };
};
