// @flow
import React from "react";
import Row from "./Row";
import type { PbRenderElementPluginType } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPluginType => {
    return {
        name: "pb-render-page-element-row",
        type: "pb-render-page-element",
        elementType: "row",
        render(props) {
            return <Row {...props} />;
        }
    };
};
