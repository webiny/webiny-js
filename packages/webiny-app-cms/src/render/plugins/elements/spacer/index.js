// @flow
import React from "react";
import Spacer from "./Spacer";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-spacer",
        type: "cms-render-element",
        element: "cms-element-spacer",
        render(props) {
            return <Spacer {...props} />;
        }
    };
};