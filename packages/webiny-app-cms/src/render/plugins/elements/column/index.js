// @flow
import React from "react";
import Column from "./Column";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-column",
        type: "cms-render-element",
        element: "cms-element-column",
        render(props) {
            return <Column {...props} />;
        }
    };
};