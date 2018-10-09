// @flow
import React from "react";
import Button from "./Button";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-button",
        type: "cms-render-element",
        element: "cms-element-button",
        render(props) {
            return <Button {...props} />;
        }
    };
};