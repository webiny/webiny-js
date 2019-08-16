// @flow
import React from "react";
import Row from "./Row";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "pb-render-element-row",
        type: "pb-render-element",
        elementType: "row",
        render(props) {
            return <Row {...props} />;
        }
    };
};