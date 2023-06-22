import { PbRenderElementPlugin } from "~/types";
import { createTabs } from "@webiny/app-page-builder-elements/renderers/tabs";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? () => <></>
    : createTabs();

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-tabs",
        elementType: "tabs",
        render
    };
};
