// @flow
import React from "react";
import type { RenderElementPluginType } from "webiny-app-cms/types";
import PinterestEmbed from "./PinterestEmbed";

export default (): RenderElementPluginType => {
    return {
        name: "pb-render-element-pinterest",
        type: "pb-render-element",
        elementType: "pinterest",
        render(props) {
            return <PinterestEmbed element={props.element} />;
        }
    };
};
