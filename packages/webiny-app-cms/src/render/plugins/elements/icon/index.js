// @flow
import React from "react";
import Icon from "./Icon";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "pb-render-element-icon",
        type: "pb-render-element",
        elementType: "icon",
        render(props) {
            return <Icon {...props} />;
        }
    };
};
