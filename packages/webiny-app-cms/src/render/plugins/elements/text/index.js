// @flow
import React from "react";
import Text from "./Text";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "pb-render-element-text",
        type: "pb-render-element",
        elementType: "text",
        render(props) {
            return <Text {...props} />;
        }
    };
};