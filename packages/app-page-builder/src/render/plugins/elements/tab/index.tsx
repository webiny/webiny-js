import { PbRenderElementPlugin } from "~/types";
import { createTab } from "@webiny/app-page-builder-elements/renderers/tab";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine ? () => <></> : createTab();

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-tab",
        elementType: "tab",
        render
    };
};
