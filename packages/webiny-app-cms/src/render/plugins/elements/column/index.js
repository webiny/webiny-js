// @flow
import React from "react";
import Column from "./Column";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "pb-render-element-column",
        type: "pb-render-element",
        elementType: "column",
        render(props) {
            return <Column {...props} />;
        }
    };
};