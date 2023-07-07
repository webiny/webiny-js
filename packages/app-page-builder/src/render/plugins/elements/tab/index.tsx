import { PbRenderElementPlugin } from "~/types";
import { createTab } from "@webiny/app-page-builder-elements/renderers/tab";

import React from "react";

export default (): PbRenderElementPlugin => {
    return {
        type: "pb-render-page-element",
        name: "pb-render-page-element-tab",
        elementType: "tab",
        render: createTab
    };
};
