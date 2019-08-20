// @flow
import React from "react";
import Icon from "./Icon";
import type { PbRenderElementPluginType } from "webiny-app-page-builder/types";

export default (): PbRenderElementPluginType => {
    return {
        name: "pb-render-page-element-icon",
        type: "pb-render-page-element",
        elementType: "icon",
        render(props) {
            return <Icon {...props} />;
        }
    };
};
