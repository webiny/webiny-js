// @flow
import React from "react";
import Image from "./Image";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "pb-render-element-image",
        type: "pb-render-element",
        elementType: "image",
        render(props) {
            return <Image {...props} />;
        }
    };
};