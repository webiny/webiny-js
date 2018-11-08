// @flow
import React from "react";
import OEmbed from "webiny-app-cms/render/components/OEmbed";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-codepen",
        type: "cms-render-element",
        element: "cms-element-codepen",
        render(props) {
            return <OEmbed element={props.element} />;
        }
    };
};
