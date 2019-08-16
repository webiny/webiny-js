// @flow
import React from "react";
import Block from "./Block";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "pb-render-element-block",
        type: "pb-render-element",
        elementType: "block",
        render(props) {
            return <Block {...props} />;
        }
    };
};