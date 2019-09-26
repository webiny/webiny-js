// @flow
import React from "react";
import OEmbed from "@webiny/app-page-builder/render/components/OEmbed";
import type { PbRenderElementPluginType } from "@webiny/app-page-builder/types";

export default (): PbRenderElementPluginType => {
    return {
        name: "pb-render-page-element-codepen",
        type: "pb-render-page-element",
        elementType: "codepen",
        render(props) {
            return <OEmbed element={props.element} />;
        }
    };
};
