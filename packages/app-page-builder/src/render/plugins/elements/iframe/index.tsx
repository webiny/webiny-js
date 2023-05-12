import kebabCase from "lodash/kebabCase";
import IFrame from "./IFrame";
import { createIFrame } from "@webiny/app-page-builder-elements/renderers/embeds/iframe";

import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { isLegacyRenderingEngine } from "~/utils";
import React from "react";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine
    ? props => <IFrame {...props} />
    : createIFrame();

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = kebabCase(args.elementType || "iframe");

    return {
        name: `pb-render-page-element-${elementType}`,
        type: "pb-render-page-element",
        elementType: elementType,
        render
    };
};
