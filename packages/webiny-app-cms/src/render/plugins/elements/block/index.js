// @flow
import React from "react";
import Block from "./Block";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-block",
        type: "cms-render-element",
        element: "cms-element-block",
        render(props) {
            return <Block {...props} />;
        }
    };
};