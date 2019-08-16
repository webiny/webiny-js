// @flow
import React from "react";
import OEmbed from "webiny-app-cms/render/components/OEmbed";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "pb-render-element-codepen",
        type: "pb-render-element",
        elementType: "codepen",
        render(props) {
            return <OEmbed element={props.element} />;
        }
    };
};
