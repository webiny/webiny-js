// @flow
import React from "react";
import Card from "./Card";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-card-1",
        type: "cms-render-element",
        element: "cms-element-card-1",
        render(props) {
            return <Card {...props} />;
        }
    };
};