// @flow
import React from "react";
import type { RenderElementPluginType } from "webiny-app-cms/types";
import PinterestEmbed from "./PinterestEmbed";

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-pinterest",
        type: "cms-render-element",
        element: "cms-element-pinterest",
        render(props) {
            return <PinterestEmbed element={props.element} />;
        }
    };
};
