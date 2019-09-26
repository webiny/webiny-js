// @flow
import React from "react";
import Spacer from "./Spacer";
import type { PbRenderElementPluginType } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPluginType => {
    return {
        name: "pb-render-page-element-spacer",
        type: "pb-render-page-element",
        elementType: "spacer",
        render(props) {
            return <Spacer {...props} />;
        }
    };
};
