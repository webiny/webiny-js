// @flow
import React from "react";
import OEmbed from "webiny-app-cms/render/components/OEmbed";
import type { RenderElementPluginType } from "webiny-app-cms/types";

export default (): RenderElementPluginType => {
    return {
        name: "cms-render-element-codesandbox",
        type: "cms-render-element",
        element: "cms-element-codesandbox",
        render(props) {
            return <OEmbed element={props.element} />;
        }
    };
};
