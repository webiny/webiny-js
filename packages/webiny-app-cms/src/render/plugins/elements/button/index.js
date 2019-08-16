// @flow
import React from "react";
import Button from "./Button";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "pb-render-element-button",
        type: "pb-render-element",
        elementType: "button",
        render(props) {
            return <Button {...props} />;
        }
    };
};