// @flow
import React from "react";
import Block from "./Block";
import type { PbRenderElementPluginType } from "webiny-app-page-builder/types";

export default (): PbRenderElementPluginType => {
    return {
        name: "pb-render-page-element-block",
        type: "pb-render-page-element",
        elementType: "block",
        render(props) {
            return <Block {...props} />;
        }
    };
};