// @flow
import React from "react";
import Icon from "./Icon";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-icon",
        type: "cms-render-element",
        element: "cms-element-icon",
        render(props) {
            return <Icon {...props} />;
        }
    };
};
