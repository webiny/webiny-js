// @flow
import React from "react";
import Row from "./Row";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-row",
        type: "cms-render-element",
        element: "cms-element-row",
        render(props) {
            return <Row {...props} />;
        }
    };
};