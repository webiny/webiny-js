// @flow
import React from "react";
import OEmbed from "webiny-app-cms/render/components/OEmbed";
import type { RenderElementPluginType } from "webiny-app-cms/types";
import VimeoEmbed from "./VimeoEmbed";

export default (): RenderElementPluginType => {
    const renderEmbed = props => {
        return <VimeoEmbed {...props} />;
    };

    return {
        name: "pb-render-element-vimeo",
        type: "pb-render-element",
        elementType: "vimeo",
        render(props) {
            return <OEmbed element={props.element} renderEmbed={renderEmbed} />;
        }
    };
};
