import React from "react";
import kebabCase from "lodash/kebabCase";
import Heading from "./Heading";
import { PbRenderElementPluginArgs, PbRenderElementPlugin } from "~/types";
import { createHeading } from "@webiny/app-page-builder-elements/renderers/heading";
import { isLegacyRenderingEngine } from "~/utils";

// @ts-ignore Resolve once we deprecate legacy rendering engine.
const render: PbRenderElementPlugin["render"] = isLegacyRenderingEngine ? Heading : createHeading();

export default (args: PbRenderElementPluginArgs = {}): PbRenderElementPlugin => {
    const elementType = args.elementType || "heading";

    return {
        name: `pb-render-page-element-${kebabCase(elementType)}`,
        type: "pb-render-page-element",
        elementType,
        render
    };
};
