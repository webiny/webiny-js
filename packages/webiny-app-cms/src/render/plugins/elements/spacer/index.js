// @flow
import React from "react";
import Spacer from "./Spacer";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "pb-render-element-spacer",
        type: "pb-render-element",
        elementType: "spacer",
        render(props) {
            return <Spacer {...props} />;
        }
    };
};