// @flow
import React from "react";
import Column from "./Column";
import type { PbRenderElementPluginType } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPluginType => {
    return {
        name: "pb-render-page-element-column",
        type: "pb-render-page-element",
        elementType: "column",
        render(props) {
            return <Column {...props} />;
        }
    };
};