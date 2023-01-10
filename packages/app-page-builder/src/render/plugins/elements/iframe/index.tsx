import React from "react";
import kebabCase from "lodash/kebabCase";
import IFrame from "./IFrame";
import { createIFrame } from "@webiny/app-page-builder-elements/renderers/embeds/iframe";

import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "iframe");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        renderer: createIFrame(),
        render(props) {
            return <IFrame {...props} />;
        }
    };
};
