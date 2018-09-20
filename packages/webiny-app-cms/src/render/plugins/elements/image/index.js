// @flow
import React from "react";
import Image from "./Image";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-image",
        type: "cms-render-element",
        element: "cms-element-image",
        render(props) {
            return <Image {...props} />;
        }
    };
};