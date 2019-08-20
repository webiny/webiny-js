// @flow
import React from "react";
import type { PbRenderElementPluginType } from "webiny-app-page-builder/types";
import PinterestEmbed from "./PinterestEmbed";

export default (): PbRenderElementPluginType => {
    return {
        name: "pb-render-page-element-pinterest",
        type: "pb-render-page-element",
        elementType: "pinterest",
        render(props) {
            return <PinterestEmbed element={props.element} />;
        }
    };
};
