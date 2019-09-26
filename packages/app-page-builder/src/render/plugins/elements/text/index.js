// @flow
import React from "react";
import Text from "./Text";
import type { PbRenderElementPluginType } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPluginType => {
    return {
        name: "pb-render-page-element-text",
        type: "pb-render-page-element",
        elementType: "text",
        render(props) {
            return <Text {...props} />;
        }
    };
};
