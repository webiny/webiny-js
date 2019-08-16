// @flow
import React from "react";
import OEmbed from "webiny-app-cms/render/components/OEmbed";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "pb-render-element-codesandbox",
        type: "pb-render-element",
        elementType: "codesandbox",
        render(props) {
            return <OEmbed element={props.element} />;
        }
    };
};
