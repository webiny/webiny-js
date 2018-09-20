// @flow
import React from "react";
import Text from "./Text";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-text",
        type: "cms-render-element",
        element: "cms-element-text",
        render(props) {
            return <Text {...props} />;
        }
    };
};