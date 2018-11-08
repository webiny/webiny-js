// @flow
import React from "react";
import OEmbed from "webiny-app-cms/render/components/OEmbed";
import type { RenderElementPluginType } from "webiny-app-cms/types";
import YoutubeEmbed from "./YoutubeEmbed";

export default (): RenderElementPluginType => {
    const renderEmbed = props => {
        return <YoutubeEmbed {...props} />;
    };

    return {
        name: "cms-render-element-youtube",
        type: "cms-render-element",
        element: "cms-element-youtube",
        render(props) {
            return <OEmbed element={props.element} renderEmbed={renderEmbed} />;
        }
    };
};
